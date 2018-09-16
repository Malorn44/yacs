# frozen_string_literal: true

# Non Ruby on Rails setup
# ENV['RACK_ENV'] ||= 'development'
# ENV['KARAFKA_ENV'] ||= ENV['RACK_ENV']
# Bundler.require(:default, ENV['KARAFKA_ENV'])
# Karafka::Loader.load(Karafka::App.root)

# Ruby on Rails setup
# Remove whole non-Rails setup that is above and uncomment the 4 lines below
ENV['RAILS_ENV'] ||= 'development'
ENV['KARAFKA_ENV'] = ENV['RAILS_ENV']
require ::File.expand_path('../config/environment', __FILE__)
Rails.application.eager_load!

class ConsumerApp < Karafka::App
  setup do |config|
    config.client_id = 'core'
    config.backend = :inline
    config.batch_fetching = false
    config.batch_consuming = false
    config.kafka.seed_brokers = %w(kafka://kafka:9094)
  end
end

active_terms = ENV['TERM_SHORTNAME'].split ','
uni_shortname = ENV['UNI_SHORTNAME']

ConsumerApp.consumer_groups.draw do
  active_terms.each do |term_shortname|
    consumer_group term_shortname do
      topic "#{uni_shortname}.raw_records.#{term_shortname}" do
        controller ApplicationConsumer
      end
    end
  end
end

ConsumerApp.boot!
