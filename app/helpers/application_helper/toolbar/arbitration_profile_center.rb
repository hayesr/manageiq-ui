class ApplicationHelper::Toolbar::ArbitrationProfileCenter < ApplicationHelper::Toolbar::Basic
  button_group('ems_cloud_vmdb', [
    select(
      :ems_cloud_arbitration_profile_vmdb_choice,
      'fa fa-cog fa-lg',
      t = N_('Configuration'),
      t,
      :items => [
        button(
          :ems_cloud_arbitration_profile_edit,
          'pficon pficon-edit fa-lg',
          t = N_('Edit this Arbitration Profile'),
          t,
          :full_path => "<%= edit_ems_cloud_path(@ems) %>"),
        button(
          :ems_cloud_arbitration_profile_delete,
          'pficon pficon-delete fa-lg',
          t = N_('Remove this Arbitration Profile from the VMDB'),
          t,
          :url_parms => "&refresh=y",
          :confirm   => N_("Warning: This Arbitration Profile will be permanently removed from the Virtual Management Database.  Are you sure you want to remove this Arbitration Profile?")),
      ]
    ),
  ])
end
