require "spec_helper"

describe EmsCloudHelper do
  def role_allows(_)
    true
  end

  before do
    @ems = FactoryGirl.create(:ems_openstack, :zone => FactoryGirl.build(:zone))
    controller.stub(:restful?).and_return(true)
    controller.stub(:controller_name).and_return("ems_cloud")
  end

  context "textual_instances" do
    it "sets restful path for instances in summary for restful controllers" do

      FactoryGirl.create(:vm_openstack)
      vms = ManageIQ::Providers::Openstack::CloudManager::Vm.first
      vms.update_attributes(:ems_id => @ems.id)
      result = textual_instances
      expect(result[:link]).to eq("/ems_cloud/#{@ems.id}?display=instances")
    end
  end

  context "textual_images" do
    it "sets restful path for images in summary for restful controllers" do
      FactoryGirl.create(:template_cloud)
      template = MiqTemplate.first
      template.update_attributes(:ems_id => @ems.id)
      result = textual_images
      expect(result[:link]).to eq("/ems_cloud/#{@ems.id}?display=images")
    end
  end
end
