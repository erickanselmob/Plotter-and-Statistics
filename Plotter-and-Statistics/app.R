library(shiny)
library(ggplot2)
library(dplyr)
library(tidyr)
library(stringr)
library(purrr)
library(readr)
library(DT)
library(shiny.i18n)
library(colourpicker)
library(RColorBrewer)

# Source modules and utilities
source("R/utils_data.R", local = TRUE)
source("R/i18n.R", local = TRUE)
source("R/mod_project_manager.R", local = TRUE)
source("R/mod_data_entry.R", local = TRUE)
source("R/mod_plotter.R", local = TRUE)
source("R/mod_statistics.R", local = TRUE)

app_ui <- function(request) {
  i18n <- init_translator()

  fluidPage(
    tags$head(
      tags$link(rel = "stylesheet", type = "text/css", href = "styles.css")
    ),
    titlePanel(i18n$t("app_title")),
    uiOutput("router")
  )
}

app_server <- function(input, output, session) {
  # Translator (reactive to language changes)
  i18n <- init_translator()

  # Store app state across modules
  app_state <- reactiveValues(
    project_name = NULL,
    groups = character(0),
    colors = character(0), # named vector of colors by group
    data = initialize_empty_dataset() # data.frame with column Parameter
  )

  # Language selector UI helper
  language_selector_ui <- reactive({
    languages <- available_languages()
    selectInput(
      inputId = "selected_language",
      label = i18n$t("language_label"),
      choices = setNames(languages, languages),
      selected = get_default_language()
    )
  })

  # Observe language selection
  observeEvent(input$selected_language, {
    req(input$selected_language)
    set_current_language(input$selected_language)
    i18n$set_translation_language(input$selected_language)
    # Notify modules about language change via session userData
    session$userData$i18n <- i18n
    output$router <- renderUI(router_ui())
  }, ignoreInit = TRUE)

  # Make translator available to modules
  session$userData$i18n <- i18n

  # Simple router: landing -> workspace
  current_page <- reactiveVal("landing")

  observeEvent(input$go_to_workspace, { current_page("workspace") })
  observeEvent(input$back_to_landing, { current_page("landing") })

  router_ui <- reactive({
    i18n <- session$userData$i18n %||% i18n
    if (identical(current_page(), "landing")) {
      tagList(
        fluidRow(
          column(8, h3(i18n$t("projects_title"))),
          column(4, language_selector_ui())
        ),
        fluidRow(
          column(8,
                 selectInput("landing_project_select", i18n$t("select_project"), choices = list_projects(), selected = app_state$project_name)
          ),
          column(4,
                 actionButton("landing_new_project", i18n$t("new_project")),
                 actionButton("go_to_workspace", i18n$t("open_project"))
          )
        )
      )
    } else {
      # Workspace UI
      sidebarLayout(
        sidebarPanel(
          actionButton("back_to_landing", i18n$t("back_to_projects")),
          tags$hr(),
          language_selector_ui(),
          tags$hr(),
          mod_project_manager_ui("project_mgr")
        ),
        mainPanel(
          tabsetPanel(
            id = "main_tabs",
            tabPanel(title = i18n$t("tab_data_entry"), mod_data_entry_ui("data_entry")),
            tabPanel(title = i18n$t("tab_plot"), mod_plotter_ui("plotter")),
            tabPanel(title = i18n$t("tab_stats"), mod_statistics_ui("stats"))
          )
        )
      )
    }
  })

  output$router <- renderUI(router_ui())

  # Landing events
  observeEvent(input$landing_new_project, {
    # Proxy to module's new project button
    session$sendInputMessage("project_mgr-new_project", list(value = 1))
    app_state$project_name <- app_state$project_name %||% list_projects()[1]
    updateSelectInput(session, "landing_project_select", choices = list_projects(), selected = app_state$project_name)
  })

  observeEvent(input$landing_project_select, {
    req(input$landing_project_select)
    obj <- load_project(input$landing_project_select)
    if (!is.null(obj)) {
      app_state$project_name <- obj$project_name
      app_state$groups <- obj$groups %||% character(0)
      app_state$colors <- obj$colors %||% ensure_group_colors(app_state$groups)
      app_state$data <- obj$data %||% initialize_empty_dataset()
    }
  })

  observe({
    # If a project is selected on landing, open workspace when pressing open button
    if (!is.null(input$go_to_workspace) && input$go_to_workspace > 0) {
      current_page("workspace")
    }
  })

  # Modules
  callModule(mod_project_manager_server, "project_mgr", app_state = app_state)
  callModule(mod_data_entry_server, "data_entry", app_state = app_state)
  callModule(mod_plotter_server, "plotter", app_state = app_state)
  callModule(mod_statistics_server, "stats", app_state = app_state)
}

shinyApp(ui = app_ui, server = app_server)

