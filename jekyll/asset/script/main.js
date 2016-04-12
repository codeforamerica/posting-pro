(function () {
    'use strict';

    var templates = {};
    var acceptedTypes = ["tech", "sexism", "realism"];
    var currentSkillsAnalysis = {};

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
        cuff.controls.totalCountOutput = totalOutputControl;
        cuff.controls.countOutput = countOutputControl;
        cuff.controls.readingLevelOutput = readingLevelOutputControl;
        cuff.controls.averageRLOutput = averageRLOutputControl;
        cuff.controls.contextOutput = contextOutputControl;
        cuff.controls.errorTooltip = errorTooltipControl;
        cuff.controls.infoTooltip = infoTooltipControl;
        cuff.controls.loadSkillsPageButton = loadSkillsPageControl;
        cuff.controls.gotoPage1Button = gotoPage1Control;
        cuff.controls.gotoPage2Button = gotoPage2Control;
        cuff.controls.exportPostingPageButton = exportPostingPageControl;
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
            $document.trigger('lint-results', [results, element.id.replace("-input", "")]);
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
        tech: "jargon",
        sexism: "gender",
        realism: "expectations"
      };

      $(document).on('lint-results', function(event, results, descId) {
          var inputElement = $(document).find('#' + descId + '-input')[0];
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

          element = document.getElementById(descId + '-output');

          element.innerHTML = baseText;
          cuff(element); // only apply bindings for children of this element
      });
    }

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
        function() { showTooltip(element); },
        function() { hideTooltip(element); }
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
            var counter = this.querySelector('[data-role=number]');
            counters[type] = counter;
            countersArray.push(counter);
        });

        $(document).on('lint-results', function (event, results, id) {

            // trying to match the results to the counters
            if (countersArray[0].className.indexOf(id) < 0) {
              return;
            }

            countersArray.forEach(function (counter) {
                counter.innerHTML = 0;
            });

            _.forEach(acceptedTypes, function(acceptedType) {
              results.counts[acceptedType] = results.counts[acceptedType] || 0;
            });

            Object.keys(results.counts).forEach(function (type) {
                if (counters[type]) {
                    counters[type].innerHTML = results.counts[type];
                }
            });
            $(document).trigger('update-totals');
        });
    }

    function totalOutputControl (element) {
        var counters = {};
        var countersArray = [];
        $(element).find('[data-role=count]').each(function () {
            var type = this.getAttribute('data-type');
            var counter = this.querySelector('[data-role=number]');
            counters[type] = counter;
            countersArray.push(counter);
        });

        $(document).on('update-totals', function (event) {

            countersArray.forEach(function (counter) {
                counter.innerHTML =  0;
            });

            $('.count-chart-small').children().each(function() {
              var type = this.getAttribute('data-type');
              if (counters[type]) {
                var subCount = $(this).find('[data-role=number]')[0].innerHTML * 1;
                counters[type].innerHTML = counters[type].innerHTML * 1 + subCount;
              }
            });

        });
    }

    function readingLevelOutputControl(element) {

      element.innerHTML = templates.readingLevel.render({"readingLevel" : 'N/A'});
      cuff(element);
        
      $(document).on('lint-results', function (event, results, id) {
        // trying to match the results to the counters
        if (element.className.indexOf(id) < 0) {
          return;
        }

        var tooHigh = results.readingLevel >= 9;
        var readingLevelSummary = {
          "readingLevel": results.readingLevel < 0 ? 'N/A' : results.readingLevel,
          "tooHigh": tooHigh,
          "level": tooHigh ? "error-highlight" : "info-highlight"
        };
        element.innerHTML = templates.readingLevel.render(readingLevelSummary);
        cuff(element);
        updateAverageReadingLevel(id, results.readingLevel);
      });
    }

    var readingLevels = {};

    function updateAverageReadingLevel(levelId, readingLevel) {
      if (readingLevel < 0) {
        delete readingLevels[levelId];
      } else {
        readingLevels[levelId] = readingLevel;
      }

      var average = Object.keys(readingLevels).length === 0 ? -1
                                                     : _.round(_.mean(_.values(readingLevels)), 1);

      var tooHigh = average >= 9;
      var readingLevelSummary = {
        "readingLevel": average < 0 ? 'N/A' : average,
        "tooHigh": tooHigh,
        "level": tooHigh ? "error-highlight" : "info-highlight"
      };
      var element = $(document).find('[data-control=averageRLOutput]')[0];
      element.innerHTML = templates.readingLevel.render(readingLevelSummary);
      cuff(element);
    }

    function averageRLOutputControl(element) {
      element.innerHTML = templates.readingLevel.render({"readingLevel" : 'N/A'});
      cuff(element);
    }

    function loadSkillsPageControl(element) {
      $(element).bind('click', function() {
        $("#page_1").hide();
        generateSkillsControl();
        $("#page_2").show();
      });
    }

    function gotoPage1Control(element) {
      $(element).bind('click', function() {
        $("#page_2").hide();
        $("#page_3").hide();
        $("#page_1").show();
      });
    }

    function gotoPage2Control(element) {
      $(element).bind('click', function() {
        $("#page_3").hide();
        $("#page_1").hide();
        $("#page_2").show();
      });
    }

    var currentSkillSet = {};

    function generateSkillsControl() {
      var MAX_SKILLS = 5;
      var jobDescription = $("#job-desc-input").val();

      getSkillsEngineCompetencies(jobDescription, function(data) {
        currentSkillSet = {}; // reset data

        if(data && data.result && data.result.competencies_analysis) {
          currentSkillsAnalysis = data.result.competencies_analysis;

          if(currentSkillsAnalysis.skills && currentSkillsAnalysis.skills.length) {
            var skills = [];

            var len = _.min([MAX_SKILLS, currentSkillsAnalysis.skills.length]);
            for(var i = 0; i < len; i++) {
              var skill = {
                name: currentSkillsAnalysis.skills[i][0],
                id: "skill" + i
              };
              skills.push(skill);
              currentSkillSet[skill.id] = skill.name;
            }

            renderSkillSet("Soft Skills", skills, "soft-skills");
          }

          if(currentSkillsAnalysis.tools && currentSkillsAnalysis.tools.length) {
            var tools = [];

            var len = _.min([MAX_SKILLS, currentSkillsAnalysis.tools.length]);
            for(var i = 0; i < len; i++) {
              var tool = {
                name: currentSkillsAnalysis.tools[i].title,
                id: "tool" + i
              };
              tools.push(tool);
              currentSkillSet[tool.id] = tool.name;
            }

            renderSkillSet("Hard Skills", tools, "hard-skills");
          }
        }
      });
    }

    function exportPostingPageControl(element) {
      $(element).bind('click', function() {
        $("#page_2").hide();
        var content = composePostingFromFields();
        $("#final-posting")[0].innerHTML = content;
        $("#page_3").show();
      });
    }

    function composePostingFromFields() {
      var postingData = {};

      var companyDescriptionEl = $("#company-desc-input");
      if(companyDescriptionEl) postingData.companyDescription = companyDescriptionEl.val();

      var jobDescriptionEl = $("#job-desc-input");
      if(jobDescriptionEl) postingData.jobDescription = jobDescriptionEl.val();

      var locationEl = $("#locationinput");
      if(locationEl) postingData.location = locationEl.val();

      var employmentTypeEl = $("#select-employment-type option:selected");
      if(employmentTypeEl) postingData.employmentType = employmentTypeEl.text();

      var applicationMethodEl = $("#positionapply");
      if(applicationMethodEl) postingData.applicationMethod = applicationMethodEl.val();

      var positionTitleEl = $("#positiontitle");
      if(positionTitleEl) postingData.positionTitle = positionTitleEl.val();

      var requiredSkills = [];
      var preferredSkills = [];
      _.forOwn(currentSkillSet, function(skillName, skillId) {
        var skillSwitchEl = $("input:radio[name=switch-"+ skillId +"]:checked");
        if(skillSwitchEl) {
          switch(skillSwitchEl.val()) {
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

            case 'na':
            default:
              break;
          }
        }
      });
      postingData.requiredSkills = requiredSkills;
      postingData.preferredSkills = preferredSkills;

      // Also include Certs

      var trainingOfferedEl = $("input:radio[name=training]:checked");
      if(trainingOfferedEl) postingData.trainingOffered = trainingOfferedEl.val();

      return templates.fullJobPosting.render(postingData, templates);
    }

    function renderSkillSet(name, skills, id) {
      var skillSet = {
        id: id,
        type: name,
        skills: skills
      };

      $("#"+id)[0].innerHTML = templates.skillSet.render(skillSet, templates);
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
