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
        cuff.controls.countOutput = countOutputControl;
        cuff.controls.readingLevelOutput = readingLevelOutputControl;
        cuff.controls.freshStartButton = freshStartControl;
        cuff.controls.showTemplatesButton = showTemplatesControl;
        cuff.controls.pickTemplateButton = pickTemplateControl;
        cuff.controls.gotoPage2Button = gotoPage2Control;
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
      element.innerHTML = templates.analysisField.render({"id" : element.id, "placeholder" : element.getAttributeNode("placeholder").value });
      cuff(element);
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
            var eventId = element.getAttributeNode("event-id").value;
            $document.trigger('lint-results-' + eventId, results);
        });
    }

    function countOutputControl (element) {

      element.innerHTML = templates.issueCount.render({'issueCount' : '0'});
      cuff(element);

      var eventId = element.getAttributeNode('event-id').value;
      $(document).on('lint-results-' + eventId, function (event, results) {
        var sexismIssues = _.filter(results.issues, function(i) {
          return _.has(i.increment, 'sexism');
        });
        element.innerHTML = templates.issueCount.render({ 'issueCount' : sexismIssues.length});
        cuff(element);
      });
    }

    function readingLevelOutputControl(element) {

      element.innerHTML = templates.readingLevel.render({"readingLevel" : 'N/A'});
      cuff(element);

      var eventId = element.getAttributeNode("event-id").value;
      $(document).on('lint-results-' + eventId, function (event, results) {
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
        $("[name=positiontitle]").val('');
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
        showPage('1');
      });
    }

    function gotoPage2Control(element) {
      $(element).bind('click', function() {
        showPage('2');
      });
    }

    function freshStartControl(element) {
      $(element).bind('click', function() {
        populateBlankFields();
        showPage('2');
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

        $("#template-or-new").hide();
        $("#template-shower").show();
      });
    }

    function pickTemplateControl(element) {
      $(element).bind('click', function() {
        var $templateSelector = $("#template-list");
        var id = $templateSelector.val();

        getTemplate(id, function(data) {
          if(data) populateFieldsWithData(data);
          showPage('2');
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
      $("[name=positiontitle]").val(data.job_title);
      $("#company-desc-input").val(data.company_description).trigger('keyup'); // keyup triggers results box
      $("#job-desc-input").val(data.job_description).trigger('keyup'); // keyup triggers results box

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

      var $positionTitleEl = $("input[name='positiontitle']");
      if($positionTitleEl) postingData.positionTitle = $positionTitleEl.val();

      postingData.companyDescription = captureFormattedField("company-desc-input");
      postingData.jobDescription = captureFormattedField("job-desc-output");
      postingData.requiredFoundationalCompetencies = captureDoubleFieldValues('reqcomp-foundation');
      postingData.requiredOccupationalCompetencies = captureDoubleFieldValues('reqcomp-occupation');
      postingData.hasRequiredCompetencies = postingData.requiredFoundationalCompetencies.length || postingData.requiredOccupationalCompetencies.length;
      postingData.preferredFoundationalCompetencies = captureDoubleFieldValues('prefcomp-foundation');
      postingData.preferredOccupationalCompetencies = captureDoubleFieldValues('prefcomp-occupation');
      postingData.hasPreferredCompetencies = postingData.preferredFoundationalCompetencies.length || postingData.preferredOccupationalCompetencies.length;
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
        var inputs = $(this).find('input[name=value]');
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
        var descriptionInputs = $(this).find('input[name=description]');

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
