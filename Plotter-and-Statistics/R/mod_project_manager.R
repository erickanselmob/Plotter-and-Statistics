# Project Manager Module ----------------------------------------------------

mod_project_manager_ui <- function(id) {
  ns <- NS(id)
  tagList(
    uiOutput(ns("pm_ui"))
  )
}

mod_project_manager_server <- function(input, output, session, app_state) {
  ns <- session$ns

  ensure_projects_dir()

  output$pm_ui <- renderUI({
    i18n <- session$userData$i18n %||% init_translator()
    tagList(
      h4(i18n$t("projects_title")),
      selectInput(ns("project_select"), i18n$t("select_project"), choices = list_projects(), selected = app_state$project_name),
      textInput(ns("project_name"), i18n$t("project_name_label"), value = app_state$project_name %||% ""),
      div(
        actionButton(ns("new_project"), i18n$t("new_project")),
        actionButton(ns("save_project"), i18n$t("save_project")),
        actionButton(ns("rename_project"), i18n$t("rename_project")),
        actionButton(ns("delete_project"), i18n$t("delete_project"))
      )
    )
  })

  observe({
    # Keep selectInput updated with files
    updateSelectInput(session, "project_select", choices = list_projects(), selected = isolate(app_state$project_name))
  })

  observeEvent(input$new_project, {
    i18n <- session$userData$i18n %||% init_translator()
    name <- trimws(input$project_name)
    if (name == "") name <- paste0(i18n$t("project"), " ", format(Sys.time(), "%Y%m%d-%H%M%S"))
    name <- gsub("[\\/:*?\"<>|]", "_", name)
    # Initialize state
    app_state$project_name <- name
    app_state$groups <- c("Group 1")
    app_state$data <- initialize_empty_dataset()
    app_state$data <- add_group_column(app_state$data, app_state$groups[[1]])
    app_state$data <- add_parameter_row(app_state$data, i18n$t("parameter_1"))
    app_state$colors <- ensure_group_colors(app_state$groups)
    save_project(app_state$project_name, app_state)
    updateTextInput(session, "project_name", value = app_state$project_name)
    updateSelectInput(session, "project_select", choices = list_projects(), selected = app_state$project_name)
    showNotification(i18n$t("project_created"), type = "message")
  })

  observeEvent(input$save_project, {
    i18n <- session$userData$i18n %||% init_translator()
    if (isTRUE(save_project(app_state$project_name %||% input$project_name, app_state))) {
      app_state$project_name <- app_state$project_name %||% input$project_name
      updateSelectInput(session, "project_select", choices = list_projects(), selected = app_state$project_name)
      showNotification(i18n$t("project_saved"), type = "message")
    } else {
      showNotification(i18n$t("project_save_failed"), type = "error")
    }
  })

  observeEvent(input$project_select, {
    req(input$project_select)
    obj <- load_project(input$project_select)
    if (!is.null(obj)) {
      app_state$project_name <- obj$project_name
      app_state$groups <- obj$groups %||% character(0)
      app_state$colors <- obj$colors %||% ensure_group_colors(app_state$groups)
      app_state$data <- obj$data %||% initialize_empty_dataset()
      updateTextInput(session, "project_name", value = app_state$project_name)
    }
  })

  observeEvent(input$rename_project, {
    i18n <- session$userData$i18n %||% init_translator()
    old <- app_state$project_name
    new <- trimws(input$project_name)
    if (is.null(old) || old == "" || new == "") return(NULL)
    if (isTRUE(rename_project(old, new))) {
      app_state$project_name <- new
      updateSelectInput(session, "project_select", choices = list_projects(), selected = app_state$project_name)
      showNotification(i18n$t("project_renamed"), type = "message")
    } else {
      showNotification(i18n$t("project_rename_failed"), type = "error")
    }
  })

  observeEvent(input$delete_project, {
    i18n <- session$userData$i18n %||% init_translator()
    name <- app_state$project_name %||% input$project_name
    if (is.null(name) || name == "") return(NULL)
    if (isTRUE(delete_project(name))) {
      app_state$project_name <- NULL
      app_state$groups <- character(0)
      app_state$colors <- character(0)
      app_state$data <- initialize_empty_dataset()
      updateTextInput(session, "project_name", value = "")
      updateSelectInput(session, "project_select", choices = list_projects(), selected = character(0))
      showNotification(i18n$t("project_deleted"), type = "warning")
    } else {
      showNotification(i18n$t("project_delete_failed"), type = "error")
    }
  })
}

