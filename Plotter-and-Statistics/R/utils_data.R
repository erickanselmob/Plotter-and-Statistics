# Utility functions for data handling and persistence

initialize_empty_dataset <- function() {
  tibble::tibble(Parameter = character())
}

generate_next_group_name <- function(existing_groups) {
  # Find highest N in names like "Group N" (case sensitive)
  matches <- regmatches(existing_groups, regexec("^Group[[:space:]]*([0-9]+)$", existing_groups))
  nums <- as.integer(purrr::map_chr(matches, function(m) if (length(m) >= 2) m[2] else NA_character_))
  nums <- nums[!is.na(nums)]
  next_idx <- if (length(nums) == 0) 1 else max(nums) + 1
  sprintf("Group %d", next_idx)
}

sanitize_group_name <- function(existing_groups, proposed_name) {
  name <- trimws(proposed_name)
  # Default or explicit "Group" should generate the next sequential Group N
  if (name == "" || tolower(name) == "group") {
    return(generate_next_group_name(existing_groups))
  }
  original <- name
  idx <- 1
  while (name %in% existing_groups) {
    idx <- idx + 1
    name <- sprintf("%s %d", original, idx)
  }
  name
}

add_group_column <- function(data, group_name) {
  if (!("Parameter" %in% colnames(data))) {
    data <- tibble::tibble(Parameter = character())
  }
  data[[group_name]] <- NA_character_
  data
}

remove_group_column <- function(data, group_name) {
  data[, setdiff(colnames(data), group_name), drop = FALSE]
}

add_parameter_row <- function(data, parameter_name) {
  if (!("Parameter" %in% colnames(data))) {
    data <- tibble::tibble(Parameter = character())
  }
  new_row <- as.list(rep(NA_character_, ncol(data)))
  names(new_row) <- colnames(data)
  new_row[["Parameter"]] <- parameter_name
  dplyr::bind_rows(data, new_row)
}

remove_last_parameter_row <- function(data) {
  if (nrow(data) <= 0) return(data)
  data[seq_len(nrow(data) - 1), , drop = FALSE]
}

parse_value_cell <- function(value_text) {
  # Accept formats like "55.04 ± 18.64" or "55,04 ± 18,64" or "55.04 +/- 18.64"
  if (is.na(value_text) || is.null(value_text) || trimws(value_text) == "") {
    return(list(mean = NA_real_, sd = NA_real_))
  }
  txt <- trimws(value_text)
  # Replace comma decimal with dot for parsing, but keep thousands? Assume no thousands separator.
  txt <- gsub(",", ".", txt, fixed = TRUE)
  # Normalize plus-minus
  txt <- gsub("\u00B1", "+/-", txt, fixed = TRUE) # ±
  # Extract numbers around +/- using whitespace class (avoid \s in R strings)
  m <- regexec("^[[:space:]]*([+-]?[0-9]*\\.?[0-9]+)[[:space:]]*(?:\\+/-)[[:space:]]*([0-9]*\\.?[0-9]+)[[:space:]]*$", txt, perl = TRUE)
  reg <- regmatches(txt, m)[[1]]
  if (length(reg) == 3) {
    mean_val <- suppressWarnings(as.numeric(reg[2]))
    sd_val <- suppressWarnings(as.numeric(reg[3]))
    return(list(mean = mean_val, sd = sd_val))
  }
  # If only a single number, treat as mean with sd = NA
  only_num <- suppressWarnings(as.numeric(txt))
  if (!is.na(only_num)) return(list(mean = only_num, sd = NA_real_))
  # Fallback: split on whitespace
  parts <- strsplit(txt, "[[:space:]]+")[[1]]
  nums <- suppressWarnings(as.numeric(parts))
  nums <- nums[!is.na(nums)]
  if (length(nums) >= 2) return(list(mean = nums[1], sd = nums[2]))
  list(mean = NA_real_, sd = NA_real_)
}

tidy_parameter_values <- function(data, parameter_name, groups) {
  if (nrow(data) == 0 || !(parameter_name %in% data$Parameter)) {
    return(dplyr::tibble(group = character(), mean = numeric(), sd = numeric()))
  }
  row <- data[data$Parameter == parameter_name, , drop = FALSE]
  out <- purrr::map_dfr(groups, function(g) {
    cell <- if (g %in% colnames(row)) row[[g]][[1]] else NA_character_
    parsed <- parse_value_cell(cell)
    dplyr::tibble(group = g, mean = parsed$mean, sd = parsed$sd)
  })
  out
}

default_palette <- function(n) {
  pal <- tryCatch(RColorBrewer::brewer.pal(max(3, min(8, n)), "Set2"), error = function(e) NULL)
  if (is.null(pal)) pal <- grDevices::rainbow(n)
  if (length(pal) < n) pal <- rep(pal, length.out = n)
  pal[seq_len(n)]
}

ensure_group_colors <- function(groups, existing_colors = NULL) {
  existing_colors <- existing_colors %||% character(0)
  pal <- default_palette(length(groups))
  new_cols <- stats::setNames(pal, groups)
  # Overwrite with existing where available
  for (g in names(existing_colors)) {
    if (g %in% groups) new_cols[g] <- existing_colors[[g]]
  }
  new_cols
}

`%||%` <- function(x, y) if (is.null(x)) y else x

# Persistence --------------------------------------------------------------

projects_dir <- function() file.path("data", "projects")

ensure_projects_dir <- function() {
  dir <- projects_dir()
  if (!dir.exists(dir)) dir.create(dir, recursive = TRUE, showWarnings = FALSE)
  dir
}

list_projects <- function() {
  ensure_projects_dir()
  files <- list.files(projects_dir(), pattern = "\\.rds$", full.names = FALSE)
  sub("\\.rds$", "", files)
}

save_project <- function(project_name, app_state) {
  ensure_projects_dir()
  if (is.null(project_name) || trimws(project_name) == "") return(FALSE)
  obj <- list(
    project_name = project_name,
    groups = app_state$groups,
    colors = app_state$colors,
    data = app_state$data
  )
  saveRDS(obj, file = file.path(projects_dir(), sprintf("%s.rds", project_name)))
  TRUE
}

load_project <- function(project_name) {
  path <- file.path(projects_dir(), sprintf("%s.rds", project_name))
  if (!file.exists(path)) return(NULL)
  readRDS(path)
}

rename_project <- function(old_name, new_name) {
  if (is.null(old_name) || is.null(new_name) || old_name == "" || new_name == "") return(FALSE)
  src <- file.path(projects_dir(), sprintf("%s.rds", old_name))
  dst <- file.path(projects_dir(), sprintf("%s.rds", new_name))
  if (!file.exists(src)) return(FALSE)
  if (file.exists(dst)) return(FALSE)
  file.rename(src, dst)
}

delete_project <- function(project_name) {
  if (is.null(project_name) || project_name == "") return(FALSE)
  path <- file.path(projects_dir(), sprintf("%s.rds", project_name))
  if (!file.exists(path)) return(FALSE)
  unlink(path)
  TRUE
}

