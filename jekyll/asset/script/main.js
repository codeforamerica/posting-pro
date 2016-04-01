(function () {
    'use strict';

    var templates = {};
    var acceptedTypes = ["tech", "sexism", "realism"];

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
        cuff.controls.countOutput = countOutputControl;
        cuff.controls.summaryOutput = summaryOutputControl;
        cuff.controls.contextOutput = contextOutputControl;
        cuff.controls.errorTooltip = errorTooltipControl;
        cuff.controls.infoTooltip = infoTooltipControl;
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

      var typeTranslation = {
        tech: "jargon",
        sexism: "gender",
        realism: "expectations"
      }

      $(document).on('lint-results', function( event, results) {
          var inputElement = $(document).find('#post-input')[0];
          var baseText = inputElement.value.replace(/\n/g, "<br>");

          // sort array by the position of the issue
          var issues = _.sortBy(results.issues, function(issue) {
              return issue.position;
          });
          issues.reverse(); // now the issues are sorted by last to first

          issues.forEach(function(issue) {

            _.forEach(acceptedTypes, function(acceptedType) { // iterate through potentially defined issue types
                if(_.has(issue.increment, acceptedType)) { // if we're supposed to increment one of these
                  issue.type = acceptedType; // create new property with that type
                  issue.typeTranslation = typeTranslation[acceptedType];
                  return false; // exit loop
                }
            });

            if(issue.type) {
              var occurrenceLength = issue.occurrence.length;

              var beginning = baseText.slice(0, issue.position);
              var end = baseText.slice(issue.position + occurrenceLength);

              var highlight = templates.highlight.render(issue, templates);
              baseText = beginning + highlight + end;
            }
          });

          element.innerHTML = baseText;
          cuff(element); // only apply bindings for children of this element
      });
    };

    function calculateOffset(element) {
      var parent = $(element).parent();
      var parentOffset = parent.offset();
      var parentWidth = parent.width();
      var documentWidth = $(document).width();

      var tooltipOffset = {
        top : parentOffset.top + 30
      };

      var tooltipWidth = 300;

      if(parentOffset.left + parentWidth + tooltipWidth > documentWidth) { // if the tooltip will go over the edge
        tooltipOffset.left = parentOffset.left - tooltipWidth + parentWidth / 2;
      } else { // if it's fine
        tooltipOffset.left = parentOffset.left;
      }

      return tooltipOffset;
    }

    function errorTooltipControl (element) {
      var parent = $(element).parent();
      parent.hover(
        function() { showTooltip(element) },
        function() { hideTooltip(element) }
      );

      var tooltipOffset = calculateOffset(element);
      $(element).position(tooltipOffset);
    }

    function infoTooltipControl(element) {
        var parent = $(element).parent();

        parent.hover(
            function() { showTooltip(element); },
            function() { hideTooltip(element); }
        );

        var tooltipOffset = calculateOffset(element);
        tooltipOffset.top += 20;
        tooltipOffset.left += 120;
        $(element).offset(tooltipOffset);
    }

    function showTooltip(element) {
      $(element).addClass("tooltip-show");
    }

    function hideTooltip(element) {
      $(element).removeClass("tooltip-show");
    }

    function issuesOutputControl (element) {
        $(document).on('lint-results', function (event, results) {
            results.issues.forEach(function (issue) {
                var occurrenceHtml = templates.occurrence.render(issue);
                issue.contextHtml = issue.context.replace('{{occurrence}}', occurrenceHtml);
            });
            element.innerHTML = templates.issues.render(results, templates);
        });
    }

    function countOutputControl (element) {
        var counters = {};
        var countersArray = [];
        $(element).find('[data-role=count]').each(function () {
            var type = this.getAttribute('data-type');
            var count = {
                circle: this.querySelector('[data-role=circle]'),
                number: this.querySelector('[data-role=number]')
            }
            counters[type] = count;
            countersArray.push(count);
        });

        $(document).on('lint-results', function (event, results) {
            countersArray.forEach(function (count) {
                count.number.innerHTML = 0;
            });

            _.forEach(acceptedTypes, function(acceptedType) {
              results.counts[acceptedType] = results.counts[acceptedType] || 0;
            });

            Object.keys(results.counts).forEach(function (type) {
                if (counters[type]) {
                    counters[type].number.innerHTML = results.counts[type];
                    $(counters[type].circle).addClass("circle-" + type);
                }
            });
        });
    };

    function summaryOutputControl(element) {
        $(document).on('lint-results', function (event, results) {
            var tooHigh = results.readingLevel >= 9;
            var readingLevelSummary = {
              "readingLevel": results.readingLevel,
              "tooHigh": tooHigh,
              "level": tooHigh ? "error-highlight" : "info-highlight"
            };
            element.innerHTML = templates.readingLevel.render(readingLevelSummary);
            cuff(element);
        });
    }

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
