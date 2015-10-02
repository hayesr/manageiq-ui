module VmHelper
  include_concern 'TextualSummary'

  # TODO: These methods can be removed once the Summary and ListNav data layer is consolidated.
  def last_date(request_type)
    @last_date ||= {}
    return @last_date[request_type] if @last_date.has_key?(request_type)
    @last_date[request_type] = self.send("last_date_#{request_type}")
  end

  def last_date_processes
    return nil if @record.operating_system.nil?
    p = @record.operating_system.processes.first(:select=>"updated_on", :order => "updated_on DESC")
    return p.nil? ? nil : p.updated_on
  end

  def set_controller_action
    url = request.parameters[:controller]
    action = "x_show"
    return url, action
  end

  def textual_cloud_network
    return nil unless @record.kind_of?(ManageIQ::Providers::Amazon::CloudManager::Vm)
    {:label => "Virtual Private Cloud", :value => @record.cloud_network ? @record.cloud_network.name : 'None'}
  end

  def textual_cloud_subnet
    return nil unless @record.kind_of?(ManageIQ::Providers::Amazon::CloudManager::Vm)
    {:label => "Cloud Subnet", :value => @record.cloud_subnet ? @record.cloud_subnet.name : 'None'}
  end

  def calculate_disk_size(size)
    size.blank? ? nil : number_to_human_size(size, :precision => 2)
  end

  def calculate_disk_name(disk)
    case disk.device_type
    when "cdrom-raw"
      "CD-ROM (IDE #{disk.location})"
    when "atapi-cdrom"
      "ATAPI CD-ROM (IDE #{disk.location})"
    when "cdrom-image"
      "CD-ROM Image (IDE #{disk.location})"
    when "disk"
      if disk.controller_type.start_with?("ide")
        "Hard Disk (IDE #{disk.location})"
      elsif disk.controller_type.start_with?("scsi")
        "Hard Disk (SCSI #{disk.location})"
      else
        "#{disk.controller_type} #{disk.location}"
      end
    when "ide"
      "Hard Disk (IDE #{disk.location})"
    when "scsi", "scsi-hardDisk"
      "Hard Disk (SCSI #{disk.location})"
    when "scsi-passthru"
      "Generic SCSI (#{disk.location})"
    else
      "#{disk.controller_type} #{disk.location}"
    end
  end
end
