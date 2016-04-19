class TreeBuilderNetwork < TreeBuilder
  def initialize(name, type, sandbox, build = true, root = nil, vm_kids = [])
    sandbox[:network_root] = TreeBuilder.build_node_id(root) if root
    @tree_vms = vm_kids
    @root = root
    unless @root
      model, id = TreeBuilder.extract_node_model_and_id(sandbox[:network_root])
      @root = model.constantize.find_by(:id => id)
    end
    super(name, type, sandbox, build)
  end

  private

  def tree_init_options(_tree_name)
    {:full_ids => true}
  end

  def set_locals_for_render
    locals = super
    locals.merge!(:id_prefix                   => 'h_',
                  :autoload                    => true,
                  :click_url                   => "/vm/show/",
                  :onclick                     => "miqOnClickHostNet",
                  :onmousein                   => "miqOnMouseInHostNet",
                  :onmouseout                  => "miqOnMouseOutHostNet",
                  :open_close_all_on_dbl_click => true)
  end

  def root_options
    [@root.name, _("Host: %{name}") % {:name => @root.name}, 'host']
  end

  def x_get_tree_roots(count_only = false, _options)
    kids = count_only ? 0 : []
    unless @root.switches.empty?
      kids = count_only_or_objects(count_only, @root.switches)
    end
    kids
  end

  def x_get_tree_switch_kids(parent, count_only)
    objects = []
    unless parent.guest_devices.empty?
      objects.concat(parent.guest_devices)
    end
    unless parent.lans.empty?
      objects.concat(parent.lans)
    end
      count_only_or_objects(count_only, objects)
  end

  def x_get_tree_guest_device_kids(parent, count_only)
    count_only ? 0 : []
  end

  def x_get_tree_lan_kids(parent, count_only)
    kids = count_only ? 0 : []
    if parent.respond_to?("vms_and_templates") && parent.vms_and_templates.length > 0
      kids = count_only_or_objects(count_only, parent.vms_and_templates.sort_by { |l| l.name.downcase })
    end
    @tree_vms.concat(kids) unless count_only
    kids
  end
end