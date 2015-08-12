class ApplicationController
  module Timezone
    extend ActiveSupport::Concern

    included do
      helper_method :get_timezone_abbr, :get_timezone_offset
      helper_method :get_timezone_for_userid, :server_timezone

      hide_action :get_timezone_abbr, :get_timezone_offset
      hide_action :get_timezone_for_userid, :server_timezone
    end

    # return timezone abbreviation
    def get_timezone_abbr(user = nil)
      if user.nil?
        tz = server_timezone
        time = Time.now
      else
        tz = Time.zone
        time = Time.zone.now
      end
      time.in_time_zone(tz).strftime("%Z")
    end

    # returns utc_offset of timezone
    def get_timezone_offset(user = nil, formatted = false)
      tz = get_timezone_for_userid(user)
      tz = ActiveSupport::TimeZone::MAPPING[tz]
      ActiveSupport::TimeZone.all.each do  |a|
        if ActiveSupport::TimeZone::MAPPING[a.name] == tz
          if formatted
            return a.formatted_offset
          else
            return a.utc_offset
          end
        end
      end
    end

    def get_timezone_for_userid(user = nil)
      user = User.find_by_userid(user) if user.kind_of?(String)
      tz = user && user.settings.fetch_path(:display, :timezone).presence
      tz || server_timezone
    end

    def server_timezone
      MiqServer.my_server.server_timezone
    end
  end
end
