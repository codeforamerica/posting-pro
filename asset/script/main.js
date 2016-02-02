(function () {
    'use strict';

    var templates = {};

    if (!isSupportedBrowser()) {
        document.getElementById('unsupported').style.display = 'block';
        return;
    }

    $(initPage);

    function initPage () {
        initTemplates();
        initControls();
    }

    function initTemplates () {
        $('[data-template]').each(function () {
            var name = this.getAttribute('data-template');
            var template = Hogan.compile(this.innerHTML, {
                delimiters: '{ }'
            });
            templates[name] = template;
        });
    }

    function initControls () {
        cuff.controls.postInput = postInputControl;
        //cuff.controls.issuesOutput = issuesOutputControl;
        //cuff.controls.countOutput = countOutputControl;
        cuff.controls.summaryOutput = summaryOutputControl;
        cuff.controls.contextOutput = contextOutputControl;
        cuff.controls.errorTooltip = errorTooltipControl;
        cuff();
    };

    function postInputControl (element) {
        var $document = $(document);
        var $element = $(element);
        var lastLintId;
        $element.on('keyup', function () {
            var inputValue = element.value.replace(/\n/g, "<br>");
            var results = joblint(inputValue);
            results.readingLevel = buildReadingLevel(element.value);
            var lintId = generateLintId(results);
            saveSession(element.value);
            $document.trigger('lint-results', results);
        });
        var session = loadSession();
        if (session) {
            element.value = loadSession();
            setTimeout(function () {
                $element.trigger('keyup');
            }, 1);
        }
    };

    function contextOutputControl (element) {

      $(document).on('lint-results', function( event, results) {
          var inputElement = $(document).find('#post-input')[0];
          var baseText = inputElement.value.replace(/\n/g, "<br>");;

          // sort array by the position of the issue
          var issues = _.sortBy(results.issues, function(issue) {
              return issue.position;
          });
          issues.reverse(); // now the issues are sorted by last to first

          issues.forEach(function(issue) {
            var occuranceLength = issue.occurance.length;

            var beginning = baseText.slice(0, issue.position);
            var end = baseText.slice(issue.position + occuranceLength);

            var highlight = templates.highlight.render(issue, templates);
            baseText = beginning + highlight + end;
          });

          element.innerHTML = baseText;
          cuff(element); // only apply bindings for children of this element
      });
    };

    function errorTooltipControl (element) {
      var parent = $(element).parent()
      parent.hover(
        function() { showTooltip(element) },
        function() { hideTooltip(element) }
      );

      var parentOffset = parent.offset();
      var parentWidth = parent.width();
      var documentWidth = $(document).width();

      var tooltipOffset = {
        top : parentOffset.top + 30
      };

      var tooltipWidth = 200;

      if(parentOffset.left + parentWidth + tooltipWidth > documentWidth) { // if the tooltip will go over the edge
        tooltipOffset.left = parentOffset.left - tooltipWidth + parentWidth / 2;
      } else { // if it's fine
        tooltipOffset.left = parentOffset.left;
      }

      $(element).offset(tooltipOffset);
    };

    function showTooltip(element) {
      $(element).addClass("error-tooltip-show");
    }

    function hideTooltip(element) {
      $(element).removeClass("error-tooltip-show");
    }

    function issuesOutputControl (element) {
        $(document).on('lint-results', function (event, results) {
            results.issues.forEach(function (issue) {
                var occuranceHtml = templates.occurance.render(issue);
                issue.contextHtml = issue.context.replace('{{occurance}}', occuranceHtml);
            });
            element.innerHTML = templates.issues.render(results, templates);
        });
    };

    function countOutputControl (element) {
        var counters = {};
        var countersArray = [];
        $(element).find('[data-role=count]').each(function () {
            var type = this.getAttribute('data-type');
            var count = {
                bar: this.querySelector('[data-role=bar]'),
                number: this.querySelector('[data-role=number]')
            }
            counters[type] = count;
            countersArray.push(count);
        });
        $(document).on('lint-results', function (event, results) {
            countersArray.forEach(function (count) {
                count.number.innerHTML = 0;
                count.bar.style.width = 0;
            });
            Object.keys(results.counts).forEach(function (type) {
                if (counters[type]) {
                    counters[type].number.innerHTML = results.counts[type];
                    counters[type].bar.style.width = (results.counts[type] * 2) + '%';
                }
            });
        });
    };

    function summaryOutputControl(element) {
        $(document).on('lint-results', function (event, results) {
            element.innerHTML = templates.readingLevel.render({level: results.readingLevel});
        });
    };

    function generateLintId (results) {
        return JSON.stringify(results);
    }

    function saveSession (postContent) {
        if (typeof window.localStorage !== 'undefined') {
            localStorage.setItem('post', postContent);
        }
    }

    function loadSession () {
        if (typeof window.localStorage !== 'undefined') {
            return localStorage.getItem('post');
        }
    }

    function isSupportedBrowser () {
        var supports = {
            events: (typeof document.addEventListener !== 'undefined'),
            querySelector: (typeof document.querySelectorAll !== 'undefined'),
            forEach: (typeof Array.prototype.forEach !== 'undefined')
        };
        return (supports.events && supports.querySelector && supports.forEach);
    }

    function buildReadingLevel (text) {
        var ts = textstatistics(text);
        var gradeLevel = ts.fleschKincaidGradeLevel();
        return gradeLevel;
    }

}());
