require 'patternfly-sass'

module Manageiq
  module Ui
    class Engine < ::Rails::Engine
      config.autoload_paths << root.join('app', 'controllers', 'mixins')
      config.autoload_paths << root.join('lib')
    end
  end
end
