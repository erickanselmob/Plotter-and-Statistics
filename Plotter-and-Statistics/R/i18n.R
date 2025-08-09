# Internationalization helpers using shiny.i18n

init_translator <- function() {
  i18n <- shiny.i18n::Translator$new(translation_json_path = "i18n/translation.json")
  i18n$set_translation_language(get_default_language())
  i18n
}

available_languages <- function() {
  c("en", "pt-BR")
}

get_default_language <- function() {
  "en"
}

.current_language <- local({
  lang <- get_default_language()
  function(value) {
    if (!missing(value)) assign(".lang", value, inherits = FALSE)
    else {
      tryCatch(get(".lang", inherits = FALSE), error = function(e) get_default_language())
    }
  }
})

set_current_language <- function(lang) {
  .current_language(lang)
}

get_current_language <- function() {
  .current_language()
}

