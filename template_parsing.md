# Parsing Job Posting Templates
The parsing algorithm for PostingPro depends on a very specific format for job posting templates for them to be imported successfully. When the Word document is imported, it is converted to plain text so we rely on keywords and specific formatting structure to tease it apart.
> We convert the content of the Word document to plain text.

## How does it work?
We expect the following headings to be present and to each end with a colon:
- Job Posting
- Company Overview
- Job Summary and Responsibilities
- Required Competencies
- Preferred Competencies
- Example Activities
- Required Certifications
- Job Details

> We scan the plain text and split sections by looking for these headings exactly (with the colon).

We expect the “Required Competencies” and “Preferred Competencies” headings to have the following sub-headings without a colon at the end:
- Occupational Competencies
- Foundational Competencies

> For each of the aforementioned sections we split by keyword similar to our original split.

We expect that each of the competency sections contains a bulleted list of competency names and descriptions. There must be a name between the competency and the description. The description paragraph must end with a period and no trailing spaces. Example:
- Active Learning: Understanding the implications of new information for both current and future problems and decisions; embracing change and understanding new concepts; asking appropriate questions; talking with others to gain answers and insights, particularly business needs and IT capabilities.

> We determine each bullet by looking for a period and a letter next to each other with no space. When the text is converted, the bullets are removed and the list items stick to each other. Within each of those line items we split the name and the description by looking for the colon.

We expect that the “Example Activities” section contains a bulleted list of paragraphs each ending with a period and without a trailing space.
> We determine each bullet by looking for a period and a letter next to each other with no space.

If all of these requirements are satisfied, the file should parse correctly.
