$('.language').on('click', function(e) {
    var lang = $(this).attr('value')
    $('#i18n_language').val(lang);
    return $('#i18n_form').submit();
});

$(document).ready(function() {
  $('.utctime').each(function() {
    const utctime = $(this).html().trim();
    const date = new Date(utctime);
    $(this).html(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
  })
});