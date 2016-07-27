Sequel.seed do
  dataset = Sinatra::Application.database[:templates]
  dataset.insert(
    :job_title => "Computer Systems Analysts",
    :company_description => "",
    :job_description => "Computer Systems Analysts analyze and consider engineering and business considerations (e.g., cost, risk, technical feasibility) to identify ways to improve computer systems and to implement selected changes. Computer Systems Analysts study user requirements, procedures, and problems to automate or improve existing systems, computer system capabilities and workflows among other things. Candidates should demonstrate a basic proficiency in utilizing data to diagnose business problems and implement technology-based solutions. Ideally, applicants should also be able to determine how changes in various factors (e.g., conditions, operations) will affect business processes and outcomes. Ideally, applicants should also be proficient in using appropriate test tools to ensure the efficacy of proposed solutions.",
    :req_occupational_skills => Sequel.pg_json([
      { 'name' => "Systems Design and Implementation", 'description' => "Demonstrated ability to assist customers, whether external or internal, in the gathering of requirements and design, implement, and support moderately complex technology solutions to existing business problems." },
      { 'name' => "Business Process and Analysis", 'description' => "Demonstrated ability to analyze and process complex data for core business operations; demonstrated ability to analyze systems and create business requirements documentation; able to perform end-to-end process analysis." },
      { 'name' => "Business Solutions", 'description' => "Able to accurately diagnose common business problems; able to devise IT strategy and to recommend appropriate technology-based solutions; some knowledge of guiding users through basic process design and prototyping; familiarity with Enterprise Resource Planning." }
    ]),
    :req_foundational_skills => Sequel.pg_json([
      { 'name' => "Critical Thinking", 'description' => "Using logic and reasoning to identify the strengths and weaknesses of alternative solutions, conclusions, or approaches to systems or process problems; ideally able to effectively decompose problems into a logical set of smaller, related sub-problems; able to judge the relative strengths and weaknesses of the set of possible options to inform decisions." },
      { 'name' => "Systems Analysis", 'description' => "Determining how a business process should work and how various changes (e.g., conditions, operations) will affect the process and outcomes; identifying and considering a decision’s repercussions for the system as a whole; ideally, able to act as a bridge between IT and the business to make optimal decisions; some ability to think across systems when needed." },
      { 'name' => "Active Learning", 'description' => "Understanding the implications of new information for both current and future problems and decisions; embracing change and understanding new concepts; asking appropriate questions; talking with others to gain answers and insights, particularly business needs and IT capabilities." }
    ]),
    :pref_occupational_skills => Sequel.pg_json([
      { 'name' => "Testing", 'description' => "Demonstrated ability to design tests, create test scripts, ensure that test cases mimic user usage, and execute and validate unit, system, and performance test routines for a team; demonstrated ability to use appropriate test tools." }
    ]),
    :pref_foundational_skills => Sequel.pg_json([
      { 'name' => "Complex Problem Solving", 'description' => "Using logic and reasoning to identify the strengths and weaknesses of alternative solutions, conclusions, or approaches to systems or process problems; ideally able to effectively decompose problems into a logical set of smaller, related sub-problems to uncover helpful insights or solutions; able to judge the relative strengths and weaknesses of the set of possible options to inform decisions. Able to think outside the box." }
    ]),
    :example_activities => Sequel.pg_array([
      "Able to determine how a business process should work and to help implement a new or changed business process, particularly as it relates to IT.",
      "Expand or modify an existing computer system to serve a new purposes or improve its work flow.",
      "Test, maintain, and monitor computer programs and systems, including coordinating the installation of computer programs and systems.",
      "Develop, document, and revise system design procedures, test procedures, and quality standards.",
      "Provide staff and users with assistance solving computer-related problems such as malfunctions and program subsidies."
    ]),
    :req_certifications => "{}"
  )
end
