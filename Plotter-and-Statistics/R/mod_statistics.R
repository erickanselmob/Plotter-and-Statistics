# Statistics Module ---------------------------------------------------------

mod_statistics_ui <- function(id) {
  ns <- NS(id)
  tagList(
    uiOutput(ns("stats_controls")),
    tableOutput(ns("summary_table")),
    downloadButton(ns("download_csv"), label = "Download")
  )
}

mod_statistics_server <- function(input, output, session, app_state) {
  ns <- session$ns

  output$stats_controls <- renderUI({
    i18n <- session$userData$i18n %||% init_translator()
    tagList(
      fluidRow(
        column(6, selectInput(ns("selected_param"), i18n$t("select_parameter"), choices = app_state$data$Parameter %||% character(0))),
        column(6, tags$div())
      )
    )
  })

  stats_data <- reactive({
    req(input$selected_param)
    df <- tidy_parameter_values(app_state$data, input$selected_param, app_state$groups)
    df$`mean ± sd` <- ifelse(is.na(df$sd), sprintf("%.4f", df$mean), sprintf("%.4f ± %.4f", df$mean, df$sd))
    df[, c("group", "mean", "sd", "mean ± sd")]
  })

  output$summary_table <- renderTable({
    stats_data()
  }, striped = TRUE, bordered = TRUE, digits = 4)

  output$download_csv <- downloadHandler(
    filename = function() {
      paste0(gsub("\\s+", "_", input$selected_param %||% "summary"), "_summary.csv")
    },
    content = function(file) {
      readr::write_csv(stats_data(), file)
    }
  )
}

