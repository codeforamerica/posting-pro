Sequel.migration do
  change do
    create_table(:templates) do
      primary_key :id
      String :job_title, null: false
      String :company_description, text: true
      String :job_description, text: true
      column :req_occupational_skills, :jsonb, default: Sequel.pg_json([])
      column :req_foundational_skills, :jsonb, default: Sequel.pg_json([])
      column :pref_occupational_skills, :jsonb, default: Sequel.pg_json([])
      column :pref_foundational_skills, :jsonb, default: Sequel.pg_json([])
      column :example_activities, "text[]", default: "{}"
      column :req_certifications, "text[]", default: "{}"
    end
  end
end
