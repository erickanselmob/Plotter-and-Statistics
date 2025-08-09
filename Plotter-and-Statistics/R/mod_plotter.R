# Plotter Module ------------------------------------------------------------

mod_plotter_ui <- function(id) {
  ns <- NS(id)
  tagList(
    uiOutput(ns("plot_controls")),
    plotOutput(ns("bar_plot"), height = "420px"),
    uiOutput(ns("download_controls"))
  )
}

mod_plotter_server <- function(input, output, session, app_state) {
  ns <- session$ns

  output$plot_controls <- renderUI({
    i18n <- session$userData$i18n %||% init_translator()
    tagList(
      fluidRow(
        column(4, selectInput(ns("selected_param"), i18n$t("select_parameter"), choices = app_state$data$Parameter %||% character(0))),
        column(4, checkboxInput(ns("show_error"), i18n$t("show_error_bars"), value = TRUE)),
        column(4, checkboxInput(ns("show_labels"), i18n$t("show_value_labels"), value = FALSE))
      ),
      fluidRow(
        column(12, h4(i18n$t("colors_title")))
      ),
      fluidRow(
        column(3, actionButton(ns("auto_palette"), i18n$t("use_palette"))),
        column(9, uiOutput(ns("color_pickers")))
      )
    )
  })

  output$color_pickers <- renderUI({
    if (length(app_state$groups) == 0) return(NULL)
    i18n <- session$userData$i18n %||% init_translator()
    cols <- app_state$colors <- ensure_group_colors(app_state$groups, app_state$colors)
    tagList(lapply(app_state$groups, function(g) {
      colourpicker::colourInput(inputId = ns(paste0("col_", g)), label = sprintf("%s: %s", i18n$t("group"), g), value = cols[[g]], allowTransparent = FALSE)
    }))
  })

  observeEvent(input$auto_palette, {
    app_state$colors <- ensure_group_colors(app_state$groups)
  })

  observe({
    # Collect color picker values
    cols <- app_state$colors
    for (g in app_state$groups) {
      id <- paste0("col_", g)
      val <- input[[id]]
      if (!is.null(val)) cols[[g]] <- val
    }
    app_state$colors <- cols
  })

  plot_data <- reactive({
    req(input$selected_param)
    tidy_parameter_values(app_state$data, input$selected_param, app_state$groups)
  })

  output$bar_plot <- renderPlot({
    df <- plot_data()
    req(nrow(df) > 0)
    cols <- app_state$colors <- ensure_group_colors(app_state$groups, app_state$colors)
    gg <- ggplot(df, aes(x = group, y = mean, fill = group)) +
      geom_col(width = 0.6, color = "#333333") +
      scale_fill_manual(values = cols) +
      labs(x = NULL, y = NULL) +
      theme_minimal(base_size = 14) +
      theme(legend.position = "none",
            panel.grid.major.x = element_blank(),
            panel.grid.minor.x = element_blank())
    if (isTRUE(input$show_error)) {
      gg <- gg + geom_errorbar(aes(ymin = mean - sd, ymax = mean + sd), width = 0.2)
    }
    if (isTRUE(input$show_labels)) {
      lab <- ifelse(is.na(df$sd), sprintf("%.2f", df$mean), sprintf("%.2f ± %.2f", df$mean, df$sd))
      gg <- gg + geom_text(aes(label = lab), vjust = -0.6)
    }
    gg
  })

  output$download_controls <- renderUI({
    i18n <- session$userData$i18n %||% init_translator()
    tagList(
      fluidRow(
        column(3, numericInput(ns("img_width"), i18n$t("img_width"), value = 1200, min = 300, step = 100)),
        column(3, numericInput(ns("img_height"), i18n$t("img_height"), value = 800, min = 300, step = 100)),
        column(3, selectInput(ns("img_format"), i18n$t("img_format"), choices = c("png", "pdf", "svg"), selected = "png")),
        column(3, downloadButton(ns("download_plot"), i18n$t("download_plot")))
      )
    )
  })

  output$download_plot <- downloadHandler(
    filename = function() {
      nm <- paste0(gsub("\\s+", "_", input$selected_param %||% "plot"), ".", input$img_format %||% "png")
      enc2native(nm)
    },
    content = function(file) {
      df <- plot_data()
      cols <- app_state$colors <- ensure_group_colors(app_state$groups, app_state$colors)
      gg <- ggplot(df, aes(x = group, y = mean, fill = group)) +
        geom_col(width = 0.6, color = "#333333") +
        scale_fill_manual(values = cols) +
        theme_minimal(base_size = 14) +
        theme(legend.position = "none",
              panel.grid.major.x = element_blank(),
              panel.grid.minor.x = element_blank())
      if (isTRUE(input$show_error)) {
        gg <- gg + geom_errorbar(aes(ymin = mean - sd, ymax = mean + sd), width = 0.2)
      }
      if (isTRUE(input$show_labels)) {
        lab <- ifelse(is.na(df$sd), sprintf("%.2f", df$mean), sprintf("%.2f ± %.2f", df$mean, df$sd))
        gg <- gg + geom_text(aes(label = lab), vjust = -0.6)
      }

      width <- (input$img_width %||% 1200) / 96
      height <- (input$img_height %||% 800) / 96
      fmt <- input$img_format %||% "png"
      if (fmt == "png") {
        ggplot2::ggsave(file, gg, width = width, height = height, dpi = 96, units = "in")
      } else if (fmt == "pdf") {
        ggplot2::ggsave(file, gg, width = width, height = height, units = "in", device = grDevices::pdf)
      } else if (fmt == "svg") {
        ggplot2::ggsave(file, gg, width = width, height = height, units = "in", device = svglite::svglite)
      } else {
        ggplot2::ggsave(file, gg, width = width, height = height, dpi = 96, units = "in")
      }
    }
  )
}

