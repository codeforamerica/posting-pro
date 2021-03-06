(function () {
    'use strict';

    var templates = {};
    var pages = ['1', '2', '3'];
    var convertedDocument;

    if (!isSupportedBrowser()) {
        document.getElementById('unsupported').style.display = 'block';
        return;
    }

    $(initPage);

    function initPage () {
        initTemplates();
        initControls();
        showPage('employer');
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
        cuff.controls.analysisField = analysisFieldControl;
        cuff.controls.postInput = postInputControl;
        cuff.controls.genderResult = genderResultControl;
        cuff.controls.readingLevelOutput = readingLevelOutputControl;
        cuff.controls.suggestionsOutput = suggestionsOutputControl;
        cuff.controls.freshStartButton = freshStartControl;
        cuff.controls.showTemplatesButton = showTemplatesControl;
        cuff.controls.pickTemplateButton = pickTemplateControl;
        cuff.controls.goToEmployerPageButton = goToEmployerPageControl;
        cuff.controls.goToJobPageButton = goToJobPageControl;
        cuff.controls.exportPostingPageButton = exportPostingPageControl;
        cuff.controls.startOverButton = startOverControl;
        cuff.controls.addSingleFieldButton = addSingleFieldControl;
        cuff.controls.addDoubleFieldButton = addDoubleFieldControl;
        cuff.controls.removeSingleFieldButton = removeSingleFieldControl;
        cuff.controls.removeDoubleFieldButton = removeDoubleFieldControl;
        cuff.controls.saveAsWordDocButton = saveAsWordDocControl;

        cuff.controls.templateListControl = templateListControl;
        cuff.controls.deleteTemplateButton = deleteTemplateControl;
        cuff.controls.templateFileInputControl = templateFileInputControl;
        cuff.controls.processNewTemplateButton = processNewTemplateControl;
        cuff();
    }

    function analysisFieldControl(element) {
      element.innerHTML = templates.analysisField.render({"id" : element.id, "placeholder" : (element.getAttributeNode("placeholder")? element.getAttributeNode("placeholder").value : '') });
      cuff(element);
    }

    function postInputControl (element) {
        var $document = $(document);
        var $element = $(element);
        $element.on('keyup', function () {
            var results = {};
            results.genderBias = decodeGender(element.value);
            results.readingLevel = buildReadingLevel(element.value);
            var readingLevelSuggestions = generateReadingLevelSuggestions(element.value);
            var genderBiasSuggestion = generateGenderBiasSuggestion(results.genderBias);
            results.suggestions = readingLevelSuggestions.concat(genderBiasSuggestion);
            var eventId = element.getAttributeNode("event-id").value;
            $document.trigger('lint-results-' + eventId, results);
        });
    }

    function genderResultControl (element) {

      element.innerHTML = templates.genderResult.render({'genderResult' : 'Neutral'});
      cuff(element);

      var eventId = element.getAttributeNode('event-id').value;
      $(document).on('lint-results-' + eventId, function (event, results) {
        element.innerHTML = templates.genderResult.render({ 'genderResult' : results.genderBias.result});
        cuff(element);
      });
    }

    function readingLevelOutputControl(element) {

      element.innerHTML = templates.readingLevel.render({"readingLevel" : '?'});
      cuff(element);

      var eventId = element.getAttributeNode("event-id").value;
      $(document).on('lint-results-' + eventId, function (event, results) {
        var tooHigh = results.readingLevel < 55;
        var readingLevelSummary = {
          "readingLevel": results.readingLevel < 0 ? '?' : results.readingLevel,
          "tooHigh": tooHigh,
          "level": tooHigh ? "error-highlight" : "info-highlight"
        };

        element.innerHTML = templates.readingLevel.render(readingLevelSummary);
        cuff(element);
      });
    }

    function suggestionsOutputControl(element) {

      var eventId = element.getAttributeNode("event-id").value;
      $(document).on('lint-results-' + eventId, function (event, results) {
        element.innerHTML = templates.suggestions.render({"suggestions" : results.suggestions});
        cuff(element);
      });
    }

    function startOverControl(element) {
      $(element).bind('click', function() {
        $("[name=positionTitle]").val('');
        $("#company-desc-input").val('').trigger('keyup'); // keyup triggers clearing right-hand results box
        $("#job-desc-input").val('').trigger('keyup'); // keyup triggers clearing right-hand results box
        $("#reqcomp-occupation-list")[0].innerHTML = '';
        $("#reqcomp-foundation-list")[0].innerHTML = '';
        $("#prefcomp-occupation-list")[0].innerHTML = '';
        $("#prefcomp-foundation-list")[0].innerHTML = '';
        $("#activity-list")[0].innerHTML = '';
        $("#cert-list")[0].innerHTML = '';
        $("#template-or-new").show();
        $("#template-shower").hide();
        showPage('employer');
      });
    }

    function freshStartControl(element) {
      $(element).bind('click', function() {
        populateBlankFields();
        showPage('employer');
      });
    }

    function showTemplatesControl(element) {
      $(element).bind('click', function() {
        getTemplateList(function(data) {
          var pickerData = {};
          pickerData.templates = data || [];
          var $pickerContainer = $("#template-picker");
          $pickerContainer[0].innerHTML = templates.templatePicker.render(pickerData);
          cuff($pickerContainer[0]);
        });
      });
    }

    function pickTemplateControl(element) {
      $(element).bind('click', function() {
        var $templateSelector = $("#template-list");
        var id = $templateSelector.val();

        getTemplate(id, function(data) {
          if(data) populateFieldsWithData(data);
        });
      });
    }

    function populateBlankFields() {
      renderField("doubleFieldTemplate", "reqcomp-occupation");
      renderField("doubleFieldTemplate", "reqcomp-foundation");
      renderField("doubleFieldTemplate", "prefcomp-occupation");
      renderField("doubleFieldTemplate", "prefcomp-foundation");
      renderField("singleFieldTemplate", "activity");
      renderField("singleFieldTemplate", "cert");
    }

    function populateFieldsWithData(data) {
      if(data.job_title) $("[name=positionTitle]").val(data.job_title);
      if(data.company_description) $("#company-desc-input").val(data.company_description).trigger('keyup'); // keyup triggers results box
      if(data.job_description) $("#job-desc-input").val(data.job_description).trigger('keyup'); // keyup triggers results box

      renderFieldWithData("doubleFieldTemplate", "reqcomp-occupation", data.req_occupational_skills);
      renderFieldWithData("doubleFieldTemplate", "reqcomp-foundation", data.req_foundational_skills);
      renderFieldWithData("doubleFieldTemplate", "prefcomp-occupation", data.pref_occupational_skills);
      renderFieldWithData("doubleFieldTemplate", "prefcomp-foundation", data.pref_foundational_skills);
      renderFieldWithData("singleFieldTemplate", "activity", data.example_activities);
      renderFieldWithData("singleFieldTemplate", "cert", data.req_certifications);
    }

    function renderFieldWithData(templateName, id, data) {
      if(data && data.length) {
        data.forEach(function(entry, index) {
          renderField(templateName, id, index, entry);
        });
      }
    }

    function showPage(pageName) {
      $("[id^=page_]").hide(); // hide all divs that begin with 'page_'
      $("#page_" + pageName).show();

      $("[id^=header_nav_]").removeClass('active'); // remove the active class from header links
      $("#header_nav_" + pageName).addClass('active');

      var navContainer = $("#left-nav");
      navContainer.val('');
      navContainer[0].innerHTML = templates[pageName + "Nav"].render({});
      cuff(navContainer[0]);

      $.mark.jump();
      $("html,body").scrollTop(0);
    }

    function goToEmployerPageControl(element) {
      $(element).bind('click', function() {
        showPage('employer');
      });
    }

    function goToJobPageControl(element) {
      $(element).bind('click', function() {
        showPage('job');
      });
    }

    function exportPostingPageControl(element) {
      $(element).bind('click', function() {
        var content = composePostingFromFields();
        $("#final-posting")[0].innerHTML = content;
        showPage('review');
        if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
          $(".word-doc").hide();
          $(".word-doc-width").css("width", "80px");
        }
        convertedDocument = htmlDocx.asBlob(content);
      });
    }

    function saveAsWordDocControl(element) {
      $(element).bind('click', function() {
        saveAs(convertedDocument, 'jobposting.docx');
      });
    }

    function addSingleFieldControl(element) {
      var i = 100; //start ID at 100 to not conflict with template entries
      $(element).bind('click', function() {
        var elementId = element.id;
        renderField("singleFieldTemplate", elementId, i++);
      });
    }

    function addDoubleFieldControl(element) {
      var i = 100; //start ID at 100 to not conflict with template entries
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

    function templateListControl(element) {
      getTemplateList(function(data) {
        var listData = {};
        listData.templates = data || [];

        element.innerHTML = templates.templateList.render(listData);
        cuff(element);
      });
    }

    function deleteTemplateControl(element) {
      $(element).bind('click', function() {
          var id = element.getAttributeNode('template-id').value;
          deleteTemplate(id, refreshTemplateList);
      });
    }

    function resetTemplateFileInput() {
      $("#process-template").hide();
      var fileName = $("#template-file-name");
      fileName.text("");
      fileName.hide();
      $("#new-template").show();
      $("#new-template").val('');
      $("#new-template-label").show();
    }

    function templateFileInputControl(element) {
      $(element).change(function() {
        var $newTemplateSelector = $(element);

        if($newTemplateSelector[0].files && $newTemplateSelector[0].files.length) {

          var file = $newTemplateSelector[0].files[0];
          $("#process-template").show();
          var fileName = $("#template-file-name");
          fileName.text(file.name);
          fileName.show();
          $("#new-template").hide();
          $("#new-template-label").hide();
        }
      });
    }

    function processNewTemplateControl(element) {
      $(element).bind('click', function() {
        var $newTemplateSelector = $("#new-template");

        if($newTemplateSelector[0].files && $newTemplateSelector[0].files.length) {

          var file = $newTemplateSelector[0].files[0];
          if(file.name.match(/\.docx$/)) { // if it's a docx file
            var reader = new FileReader();
            reader.onload = processFileBuffer;
            reader.readAsArrayBuffer(file);
          } else {
            resetTemplateFileInput();
          }
        } else {
          resetTemplateFileInput();
        }
      });
    }

    function processFileBuffer(event) {
      var buffer = event.target.result;
      var doc = new Docxgen(buffer);
      var text = doc.getFullText();
      var parsedPosting = parseMarkleTemplate(text);
      addTemplate(parsedPosting, refreshTemplateList);
      resetTemplateFileInput();
    }

    function refreshTemplateList() {
      var templateListEl = $("#template-list")[0];
      templateListControl(templateListEl);
    }

    function parseMarkleTemplate(text) {
      var parsedPosting = {};

      var text = text.replace(/<([^<]*)>/g, ""); // remove all guidance in brackets

      var headings = ["Job Posting", "Company Overview", "Job Summary and Responsibilities", "Required Competencies", "Preferred Competencies", "Example Activities", "Required Certifications", "Job Details"];
      var competencyHeadings = ["Occupational Competencies", "Foundational Competencies"];
      var sections = splitSectionsByHeading(text, headings, ":");

      parsedPosting.job_title = sections["Job Posting"] || "";
      parsedPosting.company_description = sections["Company Overview"] || "";
      parsedPosting.job_description = sections["Job Summary and Responsibilities"] || "";

      var requiredCompetencySection = sections["Required Competencies"] || "";
      var requiredCompetencySubSections = splitSectionsByHeading(requiredCompetencySection, competencyHeadings);
      var requiredOccupationalCompetencyList = getListFromSection(requiredCompetencySubSections["Occupational Competencies"] || "");
      var requiredFoundationalCompetencyList = getListFromSection(requiredCompetencySubSections["Foundational Competencies"] || "");
      parsedPosting.req_occupational_skills = splitListIntoCompetencyObjects(requiredOccupationalCompetencyList);
      parsedPosting.req_foundational_skills = splitListIntoCompetencyObjects(requiredFoundationalCompetencyList);

      var preferredCompetencySection = sections["Preferred Competencies"] || "";
      var preferredCompetencySubSections = splitSectionsByHeading(preferredCompetencySection, competencyHeadings);
      var preferredOccupationalCompetencyList = getListFromSection(preferredCompetencySubSections["Occupational Competencies"] || "");
      var preferredFoundationalCompetencyList = getListFromSection(preferredCompetencySubSections["Foundational Competencies"] || "");
      parsedPosting.pref_occupational_skills = splitListIntoCompetencyObjects(preferredOccupationalCompetencyList);
      parsedPosting.pref_foundational_skills = splitListIntoCompetencyObjects(preferredFoundationalCompetencyList);

      parsedPosting.example_activities = getListFromSection(sections["Example Activities"] || "");
      parsedPosting.req_certifications = getListFromSection(sections["Required Certifications"] || "");

      return parsedPosting;
    }

    function getListFromSection(section) {
      var splitList = [];

      if(section) {
        splitList = section.split(/\.(?=[A-Z])/); // split by periods that have no space after

        for(var i=0; i < splitList.length; i++) {
          if(i < splitList.length - 1) splitList[i] += '.'; // add back period because JS doesn't support lookbehind
        }
      }

      return splitList;
    }

    function splitListIntoCompetencyObjects(list) {
      var competencies = [];

      list.forEach(function(item) {
        var itemSections = item.split(": ");
        var competency = {
          name: itemSections[0],
          description: itemSections[1]
        };

        competencies.push(competency);
      });

      return competencies;
    }

    function splitSectionsByHeading(text, headings, delimiter) {
      var textCopy = text;
      var sections = {};
      var previousHeading;
      delimiter = delimiter || "";

      headings.forEach(function(heading) {
        if(textCopy) {
          var splitText = textCopy.split(heading+delimiter);
          if(previousHeading) sections[previousHeading] = splitText[0].trim();
          textCopy = splitText[1];
          previousHeading = heading;
        }
      });

      if(previousHeading && textCopy) sections[previousHeading] = textCopy.trim();

      return sections;
    }

    function composePostingFromFields() {
      var postingData = {};

      var $positionTitleEl = $("input[name='positionTitle']");
      if($positionTitleEl) postingData.positionTitle = $positionTitleEl.val();

      var $companyNameEl = $("input[name='companyName']");
      if($companyNameEl) postingData.companyName = $companyNameEl.val();

      var $websiteEl = $("input[name='website']");
      if($websiteEl) postingData.companyWebsite = $websiteEl.val();

      var $contactNameEl = $("input[name='contactName']");
      if($contactNameEl) postingData.contactName = $contactNameEl.val();

      var $contactEl = $("input[name='contact']");
      if($contactEl) postingData.contact = $contactEl.val();

      var $employmentTypeEl = $("select[name='employment_type'] :selected");
      if($employmentTypeEl) postingData.employmentType = $employmentTypeEl.text();

      var $seniorityLevelEl = $("select[name='seniorityLevel'] :selected");
      if($seniorityLevelEl) postingData.seniorityLevel = $seniorityLevelEl.text();

      var $workAddressEl = $("select[name='workAddress']");
      if($workAddressEl) postingData.workAddress = $workAddressEl.val();

      postingData.companyDescription = captureFormattedField("company-desc-input");
      postingData.jobDescription = captureFormattedField("job-desc-output");
      postingData.requiredFoundationalCompetencies = captureDoubleFieldValues('reqcomp-foundation');
      postingData.requiredOccupationalCompetencies = captureDoubleFieldValues('reqcomp-occupation');
      postingData.preferredFoundationalCompetencies = captureDoubleFieldValues('prefcomp-foundation');
      postingData.preferredOccupationalCompetencies = captureDoubleFieldValues('prefcomp-occupation');
      postingData.hasFoundationalCompetencies = postingData.requiredFoundationalCompetencies.length || postingData.preferredFoundationalCompetencies.length;
      postingData.hasOccupationalCompetencies = postingData.requiredOccupationalCompetencies.length || postingData.preferredOccupationalCompetencies.length;
      postingData.exampleActivities = captureSingleFieldValues('activity');
      postingData.certificationsNeeded = captureSingleFieldValues('cert');

      return templates.fullJobPosting.render(postingData, templates);
    }

    function captureFormattedField(id) {
      var description = "";

      var $descriptionEl = $("#" + id);
      if($descriptionEl) {
        description = $descriptionEl.val() || "";
        description = description.replace(/\n/g, "<br>");
      }

      return description;
    }

    function captureSingleFieldValues(name) {
      var fieldValues = [];

      $('form[name='+name+'-form]').each(function() {
        var inputs = $(this).find('textarea[name=value]');
        if(inputs && inputs.length && inputs[0].value) {
            fieldValues.push({name: inputs[0].value});
        }
      });

      return fieldValues;
    }

    function captureDoubleFieldValues(name) {
      var fieldValues = [];

      $('form[name='+name+'-form]').each(function() {
        var nameInputs = $(this).find('input[name=name]');
        var descriptionInputs = $(this).find('textarea[name=description]');

        if(nameInputs && nameInputs.length && nameInputs[0].value && descriptionInputs && descriptionInputs.length) {
            fieldValues.push({name: nameInputs[0].value, description: descriptionInputs[0].value });
        }
      });

      return fieldValues;
    }

    function renderField(templateName, id, index, data) {
      var listReference = listReference || "#" + id + "-list";  // default to using "#id-list"
      index = index || 0; // default to index 0
      var $list = $(listReference);
      $list.append(templates[templateName].render({"id": id+index, "name": id, "data": data }));
      cuff($list[0]);
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
        var readingEase = ts.fleschKincaidReadingEase();
        return readingEase;
      } else {
        return -1;
      }
    }

    function generateReadingLevelSuggestions(text) {
      var suggestions = [];
      if (text) {
        var ts = textstatistics(text);
        var longWords = ts.wordsWithFourOrMoreSyllablesList(text);
        if (longWords.length !== 0) {
          suggestions.push({
            "explanation": "Replace complex words with simpler alternatives",
            "examples": longWords.join(", ")
          });
        }
        var longSentences = ts.sentencesOver25WordsList();
        if (longSentences.length !== 0) {
          var sentenceExamples = _.map(longSentences, function(sentence) {
            return sentence.substring(0, 20) + "...";
          });

          suggestions.push({
            "explanation": "Reduce or break up sentences that are over 25 words.",
            "examples": sentenceExamples.join(", ")
          });
        }
      }
      return suggestions;
    }

    function generateGenderBiasSuggestion(genderResults) {
      return [{
        "explanation": genderResults.explanation,
        "examples": genderResults.feminineCodedWords.concat(genderResults.masculineCodedWords).join(", ")
      }];
    }

    // not currently used, remains for reference
    function getSkillsEngineCompetencies (text, callback) {
      $.postJSON('api/skillsengine/competencies', { text: text }, callback);
    }

    function getTemplateList(callback) {
      $.getJSON('api/templates', callback);
    }

    function getTemplate(id, callback) {
      $.getJSON('api/templates/'+id, callback);
    }

    function addTemplate(data, callback) {
      $.postJSON('api/templates', data, callback);
    }

    function deleteTemplate(id, callback) {
      $.postJSON('api/templates/'+id+'/delete', {}, callback);
    }

}());
