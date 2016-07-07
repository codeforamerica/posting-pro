(function () {
    'use strict';

    var templates = {};
    var acceptedTypes = ["tech", "sexism", "realism"];
    var currentSkillsAnalysis = {};
    var pages = ['1', '2'];

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
        cuff.controls.loadSkillsButton = loadSkillsControl;
        cuff.controls.gotoPage1Button = gotoPage1Control;
        cuff.controls.exportPostingPageButton = exportPostingPageControl;
        cuff.controls.startOverButton = startOverControl;
        cuff.controls.addCertButton = duplicateCertControl;
        cuff.controls.addSkillsButton = duplicateSkillControl;
        cuff.controls.removeSkillButton = removeSkillControl;
        cuff.controls.removeCertButton = removeCertControl;
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
            saveSession(element.value, element.id);
            $document.trigger('lint-results', results);
        });
        var session = loadSession(element.id);
        if (session) {
            element.value = session;
            setTimeout(function () {
                $element.trigger('keyup');
            }, 1);
        }
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

    function loadSkillsControl(element) {
      var $generateButton = $(element);
      $generateButton.bind('click', function() {
        generateSkillsControl();
        if ( $generateButton.hasClass('generate') ) { // i.e. we're not *re*generating
          renderCertification("cert");
        }
        $(".skillsEngine, #qualificationsNeeded, #exportButton").fadeIn();
        $("#generateSkills").addClass('regenerate').removeClass('generate').text('Regenerate Skills');
      });
    }

    function startOverControl(element) {
      $(element).bind('click', function() {
        currentSkillSet = {}; // clear skills data just in case user tries to export
        $("#job-desc-input").val('').trigger('keyup'); // keyup triggers clearing right-hand results box
        $("[name=positiontitle]").val('');
        $(".skillsEngine, #qualificationsNeeded, #exportButton").fadeOut();
        $("#generateSkills").addClass('generate').removeClass('regenerate').text('Generate Skills');
      });
    }

    function gotoPage1Control(element) {
      $(element).bind('click', function() {
        showPage('1');
      });
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

    var currentSkillSet = {};

    function generateSkillsControl() {
      var MAX_SKILLS = 3;
      var jobDescription = $("#job-desc-input").val();

      getSkillsEngineCompetencies(jobDescription, function(data) {
        currentSkillSet = {}; // reset data

        if(data && data.result && data.result.competencies_analysis) {
          currentSkillsAnalysis = data.result.competencies_analysis;

          var skillsAndTools = [];

          if(currentSkillsAnalysis.skills && currentSkillsAnalysis.skills.length) {
            var len = _.min([MAX_SKILLS, currentSkillsAnalysis.skills.length]);
            for(var i = 0; i < len; i++) {
              var skill = {
                name: currentSkillsAnalysis.skills[i][0],
                id: "skill" + i
              };
              skillsAndTools.push(skill);
              currentSkillSet[skill.id] = skill.name;
            }
          }

          if(currentSkillsAnalysis.tools && currentSkillsAnalysis.tools.length) {
            var len = _.min([MAX_SKILLS, currentSkillsAnalysis.tools.length]);
            for(var i = 0; i < len; i++) {
              var tool = {
                name: currentSkillsAnalysis.tools[i].title,
                id: "tool" + i
              };
              skillsAndTools.push(tool);
              currentSkillSet[tool.id] = tool.name;
            }
          }
          renderSkillSet(skillsAndTools, "skills-and-tools");
        }
      });
    }

    function duplicateCertControl(element) {
      var i = 1;
      $(element).bind('click', function() {
        renderCertification("cert" + i++);
      });
    }

    function duplicateSkillControl(element) {
      var divId = $("div #" + element.id).parent("div")[0].id;
      var i = 1;

      $(element).bind('click', function() {
        var newHTML = templates.skillAdder.render({id: divId + i++});
        var $list = $("#" + divId + " ul");
        $list.append($("<li>").append(newHTML));
        cuff($list[0]); // makes the remove button work
      });
    }

    function exportPostingPageControl(element) {
      $(element).bind('click', function() {
        var content = composePostingFromFields();
        $("#final-posting")[0].innerHTML = content;
        showPage('2');
      });
    }

    function removeSkillControl(element) {
      $(element).bind('click', function() {
        var skillId = element.id;
        delete currentSkillSet[skillId];
        $("#" + skillId).parent().remove();
      });
    }

    function removeCertControl(element) {
      $(element).bind('click', function(){
        $("#" + element.id).parents('li').remove();
      });
    }

    function composePostingFromFields() {
      var postingData = {};

      var $jobDescriptionEl = $("#job-desc-input");
      if($jobDescriptionEl) {
        var jobDescription = $jobDescriptionEl.val() || "";
        postingData.jobDescription = jobDescription.replace(/\n/g, "<br>");;
      }

      var $positionTitleEl = $("input[name='positiontitle']");
      if($positionTitleEl) postingData.positionTitle = $positionTitleEl.val();

      var requiredSkills = [];
      var preferredSkills = [];
      collectAddedSkills();
      _.forOwn(currentSkillSet, function(skillName, skillId) {
        var $skillSwitchEl = $("input:radio[name=switch-" + skillId + "]:checked");
        if($skillSwitchEl) {
          switch($skillSwitchEl.val()) {
            case 'required':
              requiredSkills.push({
                name: skillName
              });
              break;

            case 'preferred':
              preferredSkills.push({
                name: skillName
              });
              break;
            default:
              break;
          }
        }
      });
      postingData.requiredSkills = requiredSkills;
      postingData.preferredSkills = preferredSkills;

      var certificationsNeeded = [];
      $('input[name=certNeeded]').each(function() {
        if(this.value) {
          certificationsNeeded.push({name: this.value});
        }
      });

      postingData.certificationsNeeded = certificationsNeeded;
      return templates.fullJobPosting.render(postingData, templates);
    }

    function collectAddedSkills() {
      $('input.new-skill').each(function(){
        if (this.value) {
          var id = this.name.substring(7, this.name.length);
          currentSkillSet[id] = this.value;
        }
      });
    }

    function renderSkillSet(skills, id) {
      var skillSet = {
        id: id,
        skills: skills
      };

      var $element = $("#" + id)[0];
      $element.innerHTML = templates.skillSet.render(skillSet, templates);
      cuff($element);
    }

    function renderCertification(id) {
      var $certList = $('#cert-list');
      $certList.append(templates.certNeeded.render({"id": id}));
      cuff($certList[0]);
    }

    function generateLintId (results) {
        return JSON.stringify(results);
    }

    function saveSession (postContent, elementId) {
        if (typeof window.localStorage !== 'undefined') {
            localStorage.setItem(elementId, postContent);
        }
    }

    function loadSession (elementId) {
        if (typeof window.localStorage !== 'undefined') {
            return localStorage.getItem(elementId);
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
