## Blood Work Plotter (Shiny)

This Shiny application lets you:

- Manage projects (save/load as files under `data/projects`).
- Enter data where rows are parameters and columns are groups. Each cell accepts either a single mean or a "mean ± sd" value.
- Plot a bar chart per parameter with optional error bars and value labels.
- Customize colors per group.
- View and download the statistics used in the plot.
- Switch UI language between English (en) and Brazilian Portuguese (pt-BR).

### Requirements

R 4.1+ and the following packages:

```r
install.packages(c(
  "shiny", "ggplot2", "dplyr", "tidyr", "stringr", "purrr", "readr",
  "rhandsontable", "shiny.i18n", "colourpicker", "RColorBrewer", "svglite"
))
```

### Run

Open R in the project root and run:

```r
shiny::runApp()
```

The first time, create a new project from the sidebar. Add groups and parameters, fill in cells as `55.04 ± 18.64` (or `55,04 ± 18,64`), then go to the Plot tab.

### Files

- `app.R`: Main Shiny app
- `R/`: Modules and utilities
- `i18n/translation.json`: Translations for en and pt-BR
- `www/styles.css`: Basic styling
- `data/projects/`: Saved projects (created at runtime)

