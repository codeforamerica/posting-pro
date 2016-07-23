require 'sequel'

DB = Sequel.connect('postgres://user:password@host:port/database_name')
