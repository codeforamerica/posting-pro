// jQuery POST using JSON
$.postJSON = function(url, data, callback) {
    return jQuery.ajax({
        'type': 'POST',
        'url': url,
        'contentType': 'application/json; charset=utf-8',
        'data': JSON.stringify(data),
        'dataType': 'json',
        'success': callback
    });
};

$.mark = {
  jump: function (options) {
    var defaults = {
      selector: 'a.scroll-on-page-link'
    };
    if (typeof options == 'string') {
      defaults.selector = options;
    }

    options = $.extend(defaults, options);
    return $(options.selector).click(function (e) {
      var jumpobj = $(this);
      var target = jumpobj.attr('href');
      var thespeed = 1000;
      var offset = jQuery(target).offset().top;
      jQuery('html,body').animate({
        scrollTop: offset
      }, thespeed, 'swing');
      e.preventDefault();
    });
  }
};


$(function(){
  $.mark.jump();
});
