# Data Entry Module ---------------------------------------------------------

mod_data_entry_ui <- function(id) {
  ns <- NS(id)
  tagList(
    uiOutput(ns("entry_controls")),
    DT::DTOutput(ns("data_table")),
    div(class = "hint", uiOutput(ns("entry_hint")))
  )
}

mod_data_entry_server <- function(input, output, session, app_state) {
  ns <- session$ns

  output$entry_controls <- renderUI({
    i18n <- session$userData$i18n %||% init_translator()
    tagList(
      fluidRow(
        column(6, h4(i18n$t("groups_title"))),
        column(6, h4(i18n$t("parameters_title")))
      ),
      fluidRow(
        column(6,
               textInput(ns("new_group_name"), i18n$t("new_group_label"), value = ""),
               actionButton(ns("add_group"), i18n$t("add_group")),
               actionButton(ns("remove_group"), i18n$t("remove_group")),
               uiOutput(ns("group_list"))
        ),
        column(6,
               textInput(ns("new_param_name"), i18n$t("new_param_label"), value = ""),
               actionButton(ns("add_param"), i18n$t("add_param")),
               actionButton(ns("remove_param"), i18n$t("remove_param"))
        )
      )
    )
  })

  output$group_list <- renderUI({
    if (length(app_state$groups) == 0) return(NULL)
    tags$ul(class = "group-list",
            lapply(app_state$groups, function(g) tags$li(g)))
  })

  output$entry_hint <- renderUI({
    i18n <- session$userData$i18n %||% init_translator()
    span(i18n$t("entry_hint"))
  })

  observeEvent(input$add_group, {
    name <- sanitize_group_name(app_state$groups, input$new_group_name)
    app_state$groups <- c(app_state$groups, name)
    app_state$data <- add_group_column(app_state$data, name)
    app_state$colors <- ensure_group_colors(app_state$groups, app_state$colors)
    updateTextInput(session, "new_group_name", value = "")
  })

  observeEvent(input$remove_group, {
    if (length(app_state$groups) == 0) return(NULL)
    last <- tail(app_state$groups, 1)
    app_state$groups <- head(app_state$groups, -1)
    app_state$data <- remove_group_column(app_state$data, last)
    app_state$colors <- app_state$colors[app_state$groups]
  })

  observeEvent(input$add_param, {
    name <- trimws(input$new_param_name)
    if (name == "") {
      i18n <- session$userData$i18n %||% init_translator()
      name <- paste0(i18n$t("parameter"), " ", nrow(app_state$data) + 1)
    }
    app_state$data <- add_parameter_row(app_state$data, name)
    updateTextInput(session, "new_param_name", value = "")
  })

  observeEvent(input$remove_param, {
    app_state$data <- remove_last_parameter_row(app_state$data)
  })

  output$data_table <- DT::renderDT({
    df <- app_state$data
    if (!("Parameter" %in% colnames(df))) df <- initialize_empty_dataset()
    cols <- c("Parameter", app_state$groups)
    cols <- cols[cols %in% colnames(df)]
    df <- df[, cols, drop = FALSE]
    DT::datatable(
      df,
      editable = TRUE,
      options = list(dom = 't', pageLength = 100, ordering = FALSE),
      rownames = FALSE
    )
  })

  observeEvent(input$data_table_cell_edit, {
    info <- input$data_table_cell_edit
    i <- info$row
    j <- info$col + 1 # because no rownames, and DT indices start at 0 for columns
    val <- as.character(info$value)
    # Ensure base schema exists
    if (!("Parameter" %in% colnames(app_state$data))) {
      app_state$data <- initialize_empty_dataset()
    }
    # Ensure group columns exist (do not attempt to add 'Parameter' via add_group_column)
    for (nm in setdiff(app_state$groups, colnames(app_state$data))) {
      app_state$data <- add_group_column(app_state$data, nm)
    }
    # Grow rows if needed
    if (i > nrow(app_state$data)) {
      missing_rows <- i - nrow(app_state$data)
      for (k in seq_len(missing_rows)) {
        app_state$data <- add_parameter_row(app_state$data, paste0("Parameter ", nrow(app_state$data) + 1))
      }
    }
    # Bound check for column index
    if (j < 1 || j > ncol(app_state$data)) return(NULL)
    app_state$data[i, j] <- val
  })
}

