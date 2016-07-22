(function () {
    'use strict';

    var templates = {};
    var acceptedTypes = ["tech", "sexism", "realism"];
    var pages = ['1', '2'];
    var convertedDocument;

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
        cuff.controls.readingLevelOutput = readingLevelOutputControl;
        cuff.controls.contextOutput = contextOutputControl;
        cuff.controls.errorTooltip = errorTooltipControl;
        cuff.controls.gotoPage1Button = gotoPage1Control;
        cuff.controls.gotoPage2Button = gotoPage2Control;
        cuff.controls.exportPostingPageButton = exportPostingPageControl;
        cuff.controls.startOverButton = startOverControl;
        cuff.controls.addSingleFieldButton = addSingleFieldControl;
        cuff.controls.addDoubleFieldButton = addDoubleFieldControl;
        cuff.controls.removeSingleFieldButton = removeSingleFieldControl;
        cuff.controls.removeDoubleFieldButton = removeDoubleFieldControl;
        cuff.controls.saveAsWordDocButton = saveAsWordDocControl;
        cuff();
    }

    function postInputControl (element) {
        var $document = $(document);
        var $element = $(element);
        var lastLintId;
        $element.on('keyup', function () {
            var inputValue = element.value.replace(/\n/g, "<br>");
            var results = joblint(inputValue);
            results.readingLevel = buildReadingLevel(element.value);
            var lintId = generateLintId(results);
            $document.trigger('lint-results', results);
        });
    }

    function contextOutputControl (element) {

      var typeTranslation = {
        tech: "Jargon",
        sexism: "Gender",
        realism: "Expectations"
      };

      $(document).on('lint-results', function(event, results) {
          var $inputElement = $(document).find('#job-desc-input')[0];
          var baseText = $inputElement.value.replace(/\n/g, "<br>");

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

          element = document.getElementById('job-desc-output');

          element.innerHTML = baseText;
          cuff(element); // only apply bindings for children of this element
      });
    }

    function calculateOffset($parent) {
      var parentOffset = $parent.offset();
      var parentWidth = $parent.width();
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
      var $parent = $(element).parent();

      // move tooltip to body so that it doesn't get cut off
      var $tooltip = $(element).detach();
      $('body').append($tooltip);

      // save reference to hideTooltip event since we'll use it frequently
      var hideEvent = function() { hideTooltip($tooltip); };

      $parent.hover(
        function() { showTooltip($tooltip, $parent); },
        hideEvent
      );

      // hide tooltip if container scrolls so that it doesn't get unaligned
      $parent.parent().on('scroll', hideEvent);

      // when the text is changed, make sure to remove tooltip from DOM and any referencing events
      $parent.bind('DOMNodeRemoved', function(event) {
        $parent.parent().off('scroll', hideEvent);
        $tooltip.remove();
      });
    }

    function showTooltip($tooltip, $parent) {
      $tooltip.addClass("tooltip-show");

      // if a parent element was passed in, readjust offset
      if($parent) {
        var tooltipOffset = calculateOffset($parent);
        $tooltip.offset(tooltipOffset);
      }
    }

    function hideTooltip($tooltip) {
      $tooltip.removeClass("tooltip-show");
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

      element.innerHTML = templates.issueCount.render({"issueCount" : "0"});
      cuff(element);

      $(document).on('lint-results', function (event, results) {
        element.innerHTML = templates.issueCount.render({ "issueCount" : results.issues.length});
        cuff(element);
      });
    }

    function readingLevelOutputControl(element) {

      element.innerHTML = templates.readingLevel.render({"readingLevel" : 'N/A'});
      cuff(element);

      $(document).on('lint-results', function (event, results) {

        var tooHigh = results.readingLevel >= 9;
        var readingLevelSummary = {
          "readingLevel": results.readingLevel < 0 ? 'N/A' : results.readingLevel,
          "tooHigh": tooHigh,
          "level": tooHigh ? "error-highlight" : "info-highlight"
        };
        element.innerHTML = templates.readingLevel.render(readingLevelSummary);
        cuff(element);
      });
    }

    function startOverControl(element) {
      $(element).bind('click', function() {
        $("#company-desc-input").val('').trigger('keyup'); // keyup triggers clearing right-hand results box
        $("#job-desc-input").val('').trigger('keyup'); // keyup triggers clearing right-hand results box
        $("[name=positiontitle]").val('');
        // add more clearing and move to page 1
      });
    }

    function gotoPage1Control(element) {
      $(element).bind('click', function() {
        showPage('1');
      });
    }

    function gotoPage2Control(element) {
      $(element).bind('click', function() {
        showPage('2');
        populateFields();
      });
    }

    function populateFields() {
      renderField("doubleFieldTemplate", "reqcomp-occupation");
      renderField("doubleFieldTemplate", "reqcomp-foundation");
      renderField("doubleFieldTemplate", "prefcomp-occupation");
      renderField("doubleFieldTemplate", "prefcomp-foundation");
      renderField("singleFieldTemplate", "activity");
      renderField("singleFieldTemplate", "cert");
    }

    function showPage(pageId) {
      _.forEach(pages, function(page) {
        if(page == pageId) {
          $("#page_" + page).show();
        } else {
          $("#page_" + page).hide();
        }
      });
    }

    function exportPostingPageControl(element) {
      $(element).bind('click', function() {
        var content = composePostingFromFields();
        $("#final-posting")[0].innerHTML = content;
        showPage('3');
        convertedDocument = htmlDocx.asBlob(content);
      });
    }

    function saveAsWordDocControl(element) {
      $(element).bind('click', function() {
        saveAs(convertedDocument, 'jobposting.docx');
      });
    }

    function addSingleFieldControl(element) {
      var i = 1;
      $(element).bind('click', function() {
        var elementId = element.id;
        renderField("singleFieldTemplate", elementId, i++);
      });
    }

    function addDoubleFieldControl(element) {
      var i = 1;
      $(element).bind('click', function() {
        var elementId = element.id;
        renderField("doubleFieldTemplate", elementId, i++);
      });
    }

    function removeSingleFieldControl(element) {
      $(element).bind('click', function(){
        $("#" + element.id).parents('li').remove();
      });
    }

    function removeDoubleFieldControl(element) {
      $(element).bind('click', function(){
        $("#" + element.id).parents('li').remove();
      });
    }

    function composePostingFromFields() {
      var postingData = {};

      var $positionTitleEl = $("input[name='positiontitle']");
      if($positionTitleEl) postingData.positionTitle = $positionTitleEl.val();

      var $companyDescriptionEl = $("#company-desc-input");
      if($companyDescriptionEl) {
        var companyDescription = $companyDescriptionEl.val() || "";
        postingData.companyDescription = companyDescription.replace(/\n/g, "<br>");;
      }

      var $jobDescriptionEl = $("#job-desc-input");
      if($jobDescriptionEl) {
        var jobDescription = $jobDescriptionEl.val() || "";
        postingData.jobDescription = jobDescription.replace(/\n/g, "<br>");;
      }

      postingData.requiredFoundationalCompetencies = captureDoubleFieldValues('reqcomp-foundation');
      postingData.requiredOccupationalCompetencies = captureDoubleFieldValues('reqcomp-occupation');
      postingData.preferredFoundationalCompetencies = captureDoubleFieldValues('prefcomp-foundation');
      postingData.preferredOccupationalCompetencies = captureDoubleFieldValues('reqcomp-occupation');
      postingData.exampleActivities = captureSingleFieldValues('activity');
      postingData.certificationsNeeded = captureSingleFieldValues('cert');

      return templates.fullJobPosting.render(postingData, templates);
    }

    function captureSingleFieldValues(name) {
      var fieldValues = [];

      $('form[name='+name+'-form]').each(function() {
        var inputs = $(this).find('input[name=value]');
        if(inputs && inputs.length) {
            fieldValues.push({name: inputs[0].value});
        }
      });

      return fieldValues;
    }

    function captureDoubleFieldValues() {
      var fieldValues = [];

      $('form[name='+name+'-form]').each(function() {
        var nameInputs = $(this).find('input[name=name]');
        var descriptionInputs = $(this).find('input[name=description]');
        if(nameInputs && nameInputs.length && descriptionInputs && descriptionInputs.length) {
            fieldValues.push({name: nameInputs[0].value, description: descriptionInputs[0].value });
        }
      });

      return fieldValues;
    }

    function renderField(templateName, id, index, listReference) {
      listReference = listReference || "#" + id + "-list";  // default to using "#id-list"
      index = index || 0; // default to index 0
      var $list = $(listReference);
      $list.append(templates[templateName].render({"id": id+index, "name": id}));
      cuff($list[0]);
    }

    function generateLintId (results) {
        return JSON.stringify(results);
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
      if (text) { // apparently if text == "", this is false
        var ts = textstatistics(text);
        var gradeLevel = ts.fleschKincaidGradeLevel();
        return gradeLevel;
      } else {
        return -1;
      }
    }

    function getSkillsEngineCompetencies (text, callback) {
      $.postJSON('api/skillsengine/competencies', { text: text }, callback);
    }

}());
