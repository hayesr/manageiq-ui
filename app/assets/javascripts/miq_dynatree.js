/* global DoNav miqClearTreeState miqDomElementExists miqJqueryRequest miqSetButtons miqSparkle */

// Functions used by CFME for the dynatree control

// OnCheck handler for the checkboxes in tree
function miqOnCheckHandler(node) {
  var url = ManageIQ.dynatree.checkUrl + node.data.key + '?check=' + (node.isSelected() ? '0' : '1');
  miqJqueryRequest(url);
}

// Expand/collapse all children on double click
function miqOnDblClickExpand(node, _event) {
  var exp = !node.isExpanded();
  node.expand(exp);
  node.visit(function (n) {
    n.expand(exp);
  });
}

function miqAddNodeChildren(treename, key, selected_node, children) {
  var pnode = $("#" + treename + "box").dynatree('getTree').getNodeByKey(key);
  pnode.addChild(children);
  miqDynatreeActivateNodeSilently(treename, selected_node);
}

function miqDynatreeResetState(treename) {
  var key = 'treeOpenStatex' + treename ;
  delete localStorage[key + '-active'];
  delete localStorage[key + '-expand'];
  delete localStorage[key + '-focus'];
  delete localStorage[key + '-select'];
}

function miqRemoveNodeChildren(treename, key) {
  var pnode = $("#" + treename + "box").dynatree('getTree').getNodeByKey(key);
  pnode.removeChildren();
}

// Get children of a tree node via ajax for autoload
function miqOnLazyReadGetNodeChildren(node, tree, controller) {
  node.appendAjax({
    url: "/" + controller + "/tree_autoload_dynatree",
    type: 'post',
    data: {
      id: node.data.key, // Optional url arguments
      tree: tree,
      mode: "all"
    },
    success: function (node) {
      if ([ "cluster_dc_tree", "dc_tree", "rp_dc_tree", "vt_tree" ].indexOf(tree) >= 0 ) {
        // need to bind hover event to lazy loaded nodes
        miqBindHoverEvent(tree);
        var url = '/' + controller + '/tree_autoload_quads?id=' + node.data.key;
        miqJqueryRequest(url, {beforeSend: true});
      }
    },
    error: function (_node, request) {
      if (request.status == 401) {
        window.location.href = "/?timeout=true";
      }
    }
  });
}

function miqMenuEditor(id) {
  var nid = id.split('__');
  if (nid[0] != 'r') {
    var url = ManageIQ.dynatree.clickUrl + '?node_id=' + encodeURIComponent(id) + '&node_clicked=1';
    miqJqueryRequest(url, {beforeSend: true,
      complete: true,
      no_encoding: true
    });
  }
}

// Bind hover events to the tree's <a> tags
function miqBindHoverEvent(tree_name) {
  var node_id;

  $("#" + tree_name + "box a").hover(function () {
    var node = $.ui.dynatree.getNode(this);
    node_id = miqOnMouseInHostNet(node.data.key);
  }, function () {
    var node = $.ui.dynatree.getNode(this);
    miqOnMouseOutHostNet(node.data.key, node_id);
  });
}

// OnClick handler to run tree_select server method
function miqOnClickSelectTreeNode(id) {
  var rec_id = id.split('__');
  var url = '/' + ManageIQ.controller + '/tree_select/?id=' + rec_id[0];
  miqJqueryRequest(url, {beforeSend: true});
}

function miqOnClickSelectDlgEditTreeNode(id) {
  var rec_id = id.split('__');
  var url = 'tree_select/?id=' + rec_id[0];
  miqJqueryRequest(url, {beforeSend: true, complete: true});
}

// Activate and focus on a node within a tree given the node's key
function miqDynatreeActivateNode(tree, key) {
  miqSparkle(true);
  var node = $("#" + tree + "box").dynatree('getTree').getNodeByKey(key);
  if (node) {
    // Only try to activate node if it is in the tree
    if (node.isActive()) {
      $("#" + tree + "box").dynatree('getTree').reactivate();
    } else {
      node.activate();
    }
    node.focus();
  }
}

// Activate silently (no onActivate event) and focus on a node within a tree given the node's key
function miqDynatreeActivateNodeSilently(tree, key) {
  var node = $("#" + tree + "box").dynatree('getTree').getNodeByKey(key);
  if (node) { // Only try to activate node if it is in the tree
    node.activateSilently();
    node.expand();
    node.focus();
  }
}

// OnClick handler for catgories Tree
function miqOnClickProvLdapOus(id) {
  var node = $("#ldap_ous_treebox").dynatree("getTree").getNodeByKey(id);
  node.expand();
  node._activate(false, true);
  if (id.split('_-_').length > 1) {
    miqJqueryRequest(ManageIQ.dynatree.clickUrl + '?ou_id=' + id);
    return true;
  }
}

// expand all parent nodes of selected node on initial load
function miqExpandParentNodes(treename, selected_node) {
  var node = $("#" + treename + "box").dynatree("getTree").getNodeByKey(selected_node);
  node.makeVisible();
}

function miqDynatreeNodeAddClass(treename, key, klass) {
  var node;
  if (_.isString(key)) {
    node = $("#" + treename + "box").dynatree('getTree').getNodeByKey(key);
  } else {
    node = $.ui.dynatree.getNode(key);
  }
  if (node) {
    node.data.addClass = klass;
    node.render();
  } else {
    console.debug('cannot find node for key: ' + key);
  }
}

function miqDynatreeNodeRemoveClass(treename, key) {
  var node;
  if (_.isString(key)) {
    node = $("#" + treename + "box").dynatree('getTree').getNodeByKey(key);
  } else {
    node = $.ui.dynatree.getNode(key);
  }
  node.data.addClass = "";
  node.render();
}

// OnCheck handler for the tags trees
function miqOnCheckProvTags(node, treename) {
  var tree = $("#" + treename + "box").dynatree("getTree");
  var parent_key = node.data.cfme_parent_key;
  var selectedNodes = tree.getSelectedNodes();
  var all_checked = $.map(selectedNodes, function (node) {
    return node.data.key;
  });

  // need to add or delete the node manually in all_checked array
  // node select transaction is run after AJAX response comes back
  // when treestate is set to true
  if (node.isSelected()) {
    var idx = all_checked.indexOf(node.data.key);
    all_checked.splice(idx, 1);
  } else {
    all_checked.push(node.data.key);
  }

  for (var i = 0; i < all_checked.length; i++) {
    var selected_node = $("#" + treename + "box").dynatree("getTree").getNodeByKey(all_checked[i]);
    var selected_node_parent_key = selected_node.data.cfme_parent_key;
    if (typeof parent_key != "undefined") {
      // only keep the key that came in for a single value tag category
      // delete previously selected keys from the single value category before sending them up
      if (selected_node_parent_key == parent_key && node.data.key != all_checked[i]) {
        var idx = all_checked.indexOf(all_checked[i]);
        all_checked.splice(idx, 1);
        selected_node._select(false);
      }
    }
  }
  miqJqueryRequest(ManageIQ.dynatree.checkUrl + '?ids_checked=' + all_checked);
  return true;
}

function miqOnClickSelectAETreeNode(id) {
  miqJqueryRequest('/' + ManageIQ.controller + '/ae_tree_select/?id=' + id + '&tree=automate_tree');
}

function miqOnClickIncludeDomainPrefix() {
  miqJqueryRequest('/' + ManageIQ.controller + '/ae_tree_select_toggle?button=domain');
}

function miqOnClickSelectOptimizeTreeNode(id) {
  var tree;
  if ($('#miq_capacity_utilization').length == 1) {
    tree = "utilization_tree";
  } else if ($('#miq_capacity_bottlenecks').length == 1) {
    tree = "bottlenecks_tree";
  }
  if (id.split('-')[1].split('_')[0] == 'folder' ) {
    miqDynatreeActivateNodeSilently(tree, id);
    return;
  } else {
    var rep_id = id.split('__');
    miqDynatreeActivateNodeSilently(tree, rep_id);
    var url = "/miq_capacity/optimize_tree_select/?id=" + rep_id[0];
    miqJqueryRequest(url, {beforeSend: true});
  }
}

// delete specific dynatree cookies
function miqDeleteDynatreeCookies(tree_prefix) {
  miqClearTreeState(tree_prefix);
}

// toggle expand/collapse all nodes in tree
function miqDynatreeToggleExpand(treename, expand_mode) {
  $("#" + treename + "box").dynatree("getRoot").visit(function (node) {
    node.expand(expand_mode);
  });
}

// OnCheck handler for the Protect screen
function miqOnCheckProtect(node, _treename) {
  var ppid = node.data.key.split('_').pop();
  var url = ManageIQ.dynatree.checkUrl + ppid + '?check=' + Number(!node.isSelected());
  miqJqueryRequest(url);
  return true;
}

// OnClick handler for the VM Snapshot Tree
function miqOnClickSnapshotTree(id) {
  var tree = $("#" + 'snapshot_tree' + "box").dynatree("getTree");
  tree.getRoot().visit(function(node){miqDynatreeNodeRemoveClass('snapshot_tree', node);})
  miqDynatreeNodeAddClass('snapshot_tree', id, "dynatree-cfme-active")
  var pieces = id.split(/-/);
  var shortId = pieces[pieces.length - 1]
  miqJqueryRequest('/' + ManageIQ.controller + '/snap_pressed/' + shortId, {beforeSend: true, complete: true});
  return true;
}

// Show the hidden quad icon div when mousing over VMs in the Host Network tree
function miqOnMouseInHostNet(id) {
  var nid = hoverNodeId(id);
  if (nid) {
    // div id exists
    var node = $('#' + id); // Get html node
    // FIXME: replace with a saner display method
    var top  = node[0].getBoundingClientRect().top + node.scrollTop() - 220;
    $("#" + nid).css({ top: top + "px" }); // Set quad top location
    $("#" + nid).show(); // Show the quad div
    return nid; // return current node id
  }
}

// For Host Network tree, clear selection and hide previously shown quad icon div
function miqOnMouseOutHostNet(id, node_id) {
  if (hoverNodeId(id)) {
    // div id exists
    if (node_id) {
      $("#" + node_id).hide(); // Hide the quad div
    }
  }
  return true;
}

function hoverNodeId(id) {
  var ids = id.split('_'); // Break apart the node ids
  var nid = ids[ids.length - 1]; // Get the last part of the node id
  var leftNid = nid.split('-')[0];
  var rightNid = nid.split('-')[1];
  if (typeof rightNid !== 'undefined' && rightNid.match(/r/)) {
    nid = sprintf("%s-%s%012d", leftNid, rightNid.split('r')[0], rightNid.split('r')[1]);
  }
  return ((leftNid == 'v' || // Check for VM node
           leftNid == 'h') && // or Host node
          miqDomElementExists(nid)) ? nid : false;
}

// OnClick handler for Host Network Tree
function miqOnClickHostNet(id) {
  var ids = id.split('|')[0].split('_'); // Break apart the node ids
  var nid = ids[ids.length - 1].split('-'); // Get the last part of the node id
  switch (nid[0]) {
    case 'v':
      DoNav("/vm/show/" + nid[1]);
      break;
    case 'h':
      DoNav("/host/show/" + nid[1]);
      break;
    case 'c':
      DoNav("/ems_cluster/show/" + nid[1]);
      break;
    case 'rp':
      DoNav("/resource_pool/show/" + nid[1]);
      break;
    default:
      break;
  }
}

// OnClick handler for Report Menu Tree
function miqOnClickTimelineSelection(id) {
  if (id.split('__')[0] != 'p') {
    var rep_id = id.split('__');
    miqJqueryRequest(ManageIQ.dynatree.clickUrl + '?id=' + rep_id[0], {beforeSend: true, complete: true});
  }
}

// OnCheck handler for the belongs to drift/compare sections tree
function miqOnCheckSections(_tree_name, key, checked, all_checked) {
  var url = ManageIQ.dynatree.checkUrl + '?id=' + key + '&check=' + checked + '&all_checked=' + all_checked;
  miqJqueryRequest(url);
  return true;
}

// OnClick handler for catgories Tree
function miqOnClickTagCat(id) {
  if (id.split('__')[0] == 't') {
    miqJqueryRequest(ManageIQ.dynatree.clickUrl + '?id=' + id, {beforeSend: true, complete: true});
  }
}

// OnClick handler for Genealogy Tree
function miqOnClickGenealogyTree(id) {
  if (hoverNodeId(id)[0] === 'v') {
    miqJqueryRequest(ManageIQ.dynatree.clickUrl + id, {beforeSend: true, complete: true});
  }
}

// OnCheck handler for the SmartProxy Affinity tree
function miqOnClickSmartProxyAffinityCheck(node) {
  if (node.isSelected())
    var checked = '0';  // If node was selected, now unchecking
  else
    var checked = '1';
  miqJqueryRequest(ManageIQ.dynatree.checkUrl + node.data.key + '?check=' + checked);
}

function miqGetChecked(node, treename) {
  var count = 0;
  var tree = $("#" + treename + "box").dynatree("getTree");
  var selectedNodes = tree.getSelectedNodes();
  var selectedKeys = $.map(selectedNodes, function (checkedNode) {
    return checkedNode.data.key;
  });
  if (!node.isSelected()) {
    // Indicates that the current node is checked
    selectedKeys.push(node.data.key);
  } else if (node.isSelected()) {
    // Indicates that the current node is unchecked
    var index = selectedKeys.indexOf(node.data.key);
    if (index > -1) {
      selectedKeys.splice(index, 1);
    }
  }
  count = selectedKeys.length;
  if (miqDomElementExists('center_tb')) {
    miqSetButtons(count, "center_tb");
  } else {
    miqSetButtons(count, "center_buttons_div");
  }
  if (count) {
    miqJqueryRequest(ManageIQ.dynatree.checkUrl + '?all_checked=' + selectedKeys, {beforeSend: true, complete: true});
  }
}

function miqCheckAll(cb, treename) {
  $("#" + treename + "box").dynatree("getRoot").visit(function (node) {
    // calling _select to avoid onclick event when check all is clicked
    node._select(cb.checked);
  });
  var tree = $("#" + treename + "box").dynatree("getTree");
  var selectedNodes = tree.getSelectedNodes();
  var selectedKeys = $.map(selectedNodes, function (node) {
    return node.data.key;
  });

  var count = selectedKeys.length;
  if (miqDomElementExists('center_tb')) {
    miqSetButtons(count, "center_tb");
  } else if (miqDomElementExists('center_buttons_div')) {
    miqSetButtons(count, "center_buttons_div");
  }

  if (count > 0) {
    var url = ManageIQ.dynatree.checkUrl + '?check_all=' + cb.checked + '&all_checked=' + selectedKeys;
    miqJqueryRequest(url);
  }
  return true;
}

function miqDynatreeExpandNode(treename, key) {
  var node = $("#" + treename + "box").dynatree('getTree').getNodeByKey(key);
  node.expand(true);
}

function miqOnDblClickNoBaseExpand(node, _event) {
  if (!node.getParent().data.title) {
    return;
  }

  var exp = !node.isExpanded();
  node.expand(exp);
}

// OnClick handler for Server Roles Tree
function miqOnClickServerRoles(id) {
  var typ = id.split('_')[0]; // Break apart the node ids
  switch (typ) {
    case 'server':
    case 'role':
    case 'asr':
      miqJqueryRequest(ManageIQ.dynatree.clickUrl + '?id=' + id, {beforeSend: true, complete: true});
      break;
  }
}

// OnCheck handler for the belongsto tagging trees on the user edit screen
function miqOnCheckUserFilters(node, tree_name) {
  var tree_typ = tree_name.split('_')[0];
  var checked = Number(!node.isSelected());
  var url = ManageIQ.dynatree.checkUrl + node.data.key + "?check=" + checked + "&tree_typ=" + tree_typ;
  miqJqueryRequest(url);
  return true;
}

// OnCheck handler for Check All checkbox on C&U collection trees
function miqCheckCUAll(cb, treename) {
  $("#" + treename + "box").dynatree("getRoot").visit(function (node) {
    // calling _select to avoid onclick event when check all is clicked
    node._select(cb.checked);
  });
  var url = ManageIQ.dynatree.checkUrl + '?check_all=' + cb.checked + '&tree_name=' + treename;
  miqJqueryRequest(url);
  return true;
}

// OnCheck handler for the C&U collection trees
function miqOnCheckCUFilters(tree_name, key, checked) {
  var url = ManageIQ.dynatree.checkUrl + '?id=' + key + '&check=' + checked + '&tree_name=' + tree_name;
  miqJqueryRequest(url);
  return true;
}

function miqMenuChangeRow(action, elem) {
  var grid = $('#folder_grid .panel-group');
  var selected = grid.find('.panel-heading.active').parent();

  switch (action) {
    case "activate":
      grid.find('.panel-heading.active').removeClass('active');
      $(elem).addClass('active');
      break;

    case "edit":
      // quick and dirty edit - FIXME use a $modal when converted to angular
      var text = $(elem).text().trim();
      text = prompt(__("New name?"), text);
      if (text) // ! cancel
        $(elem).text(text);
      break;

    case "up":
      selected.prev().before(selected);
      break;
    case "down":
      selected.next().after(selected);
      break;

    case "top":
      selected.siblings().first().before(selected);
      break;
    case "bottom":
      selected.siblings().last().after(selected);
      break;

    case "add":
      var count = grid.find('.panel-heading').length;

      elem = $('<div>').addClass('panel-heading');
      elem.attr('id', "folder" + count);
      elem.text(__("New Folder"));
      elem.on('click', function() {
        return miqMenuChangeRow('activate', this);
      });
      elem.on('dblclick', function() {
        return miqMenuChangeRow('edit', this);
      });

      grid.append(elem);

      miqMenuChangeRow('activate', elem);

      // just shows a flash message
      miqJqueryRequest('/report/menu_folder_message_display?typ=add', {no_encoding: true});
      break;

    case "delete":
      if (! selected.length)
        break;

      var selected_id = selected.children()[0].id.split('|-|');
      if (selected_id.length == 1) {
        selected.remove();
      } else {
        // just show a flash message
        miqJqueryRequest('/report/menu_folder_message_display?typ=delete');
      }
      break;

    case "serialize":
      var items = grid.find('.panel-heading').toArray().map(function(elem) {
        return {
          id: $(elem).attr('id'),
          text: $(elem).text().trim(),
        };
      });
      var serialized = JSON.stringify(items);

      var url = '/report/menu_field_changed/?tree=' + encodeURIComponent(serialized);
      miqJqueryRequest(url, {beforeSend: true, complete: true, no_encoding: true});
      break;
  }

  return false;
}

function miqSetAETreeNodeSelectionClass(id, prevId, bValidNode) {
  if (prevId && $('#' + prevId).length) {
    miqDynatreeNodeRemoveClass("automate_tree", prevId);
  }
  if (bValidNode == "true" && $('#' + id).length) {
    miqDynatreeNodeAddClass("automate_tree", id, "ae-valid-node");
  }
}

function miqSquashToggle(treeName) {
  if (ManageIQ.tree.expandAll) {
    $('#squash_button i').attr('class', 'fa fa-minus-square-o fa-lg');
    $('#squash_button').prop('title', __('Collapse All'));
    miqDynatreeToggleExpand(treeName, true);
    ManageIQ.tree.expandAll = false;
  } else {
    $('#squash_button i').attr('class', 'fa fa-plus-square-o fa-lg');
    $('#squash_button').prop('title', __('Expand All'));
    miqDynatreeToggleExpand(treeName, false);
    ManageIQ.tree.expandAll = true;
  }
}

function miqTreeEventSafeEval(func) {
  var whitelist = ['miqOnCheckProtect',
                  'miqOnCheckHandler',
                  'miqOnCheckProvTags',
                  'miqOnCheckUserFilters',
                  'miqOnClickSmartProxyAffinityCheck',
                  'miqGetChecked',
                  'miqOnClickSelectTreeNode',
                  'miqOnClickHostNet',
                  'miqOnClickSelectAETreeNode',
                  'miqOnClickTimelineSelection',
                  'miqOnClickSelectDlgEditTreeNode',
                  'miqOnClickSelectOptimizeTreeNode',
                  'miqOnClickServerRoles',
                  'miqOnClickGenealogyTree',
                  'miqOnCheckSections',
                  'miqOnCheckCUFilters'];

  if (whitelist.includes(func)) {
    return window[func];
  } else {
    throw new Error("Function not in whitelist: " + func);
  }
}

function miqInitDynatree(options, tree) {

  if (options.check_url) {
    ManageIQ.dynatree.checkUrl = options.check_url;
  }

  if (options.click_url) {
    ManageIQ.dynatree.clickUrl = options.click_url;
  }

  if (options.group_changed) {
    miqDeleteDynatreeCookies();
  }

  $('#' + options.tree_id).dynatree({
    title: options.tree_name,
    imagePath: '',
    generateIds: true,
    idPrefix: options.id_prefix,
    children: tree,
    cookieId: options.cookie_id,
    cookie: {
      path: '/'
    },
    onDblClick: function (node, event) {
      if (options.no_base_exp) {
        miqOnDblClickNoBaseExpand(node, event);
      }
      if (options.open_close_all_on_dbl_click) {
        miqOnDblClickExpand(node, event);
      }
    },
    minExpandLevel: options.min_expand_level,
    checkbox: options.checkboxes,
    selectMode: options.select_mode,
    persist: options.tree_state,
    onClick: function(node, event) {
      var event_type = node.getEventTargetType(event);

      if (options.no_click && event_type != 'expander') {
        return false;
      }

      if (options.onclick || options.disable_checks || options.oncheck) {
        if (event_type != 'expander' && node.data.cfmeNoClick) return false;
        if (options.onclick) {
          if (event_type == 'icon' || event_type == 'title' || event.target.localName == 'img') {
            if(options.click_url) {
              if (node.isActive()) miqTreeEventSafeEval(options.onclick)(node.data.key);
              return;
            } else {
              if (miqCheckForChanges() == false) {
                this.activeNode.focus();
                return false;
              } else {
                if (node.isActive()) miqTreeEventSafeEval(options.onclick)(node.data.key);
                return;
              }
            }
          }
        }
        if (options.disable_checks || options.oncheck) {
          if (event_type == 'checkbox') {
            if (options.disable_checks) {
              return false;
            } else if (options.oncheck) {
              miqTreeEventSafeEval(options.oncheck)(node, options.tree_name);
              return;
            }
          }

          if (event_type != 'expander') return false;
        }
      }
    },
    onSelect: function(flag, node) {
      if (options.onselect) {
        var selectedNodes = node.tree.getSelectedNodes();
        var selectedKeys = $.map(selectedNodes, function(node) {
          return node.data.key;
        });
        miqTreeEventSafeEval(options.onselect)(options.tree_name, node.data.key, flag, selectedKeys);
      }
    },
    onActivate: function(node) {
      if (options.onclick) {
        miqTreeEventSafeEval(options.onclick)(node.data.key);
      }
    },
    onExpand: function(node) {
      if(options.onclick || options.disable_checks || options.oncheck) {
        miqBindHoverEvent(options.tree_name);
      }
    },
    onLazyRead: function(node) {
      if(options.autoload) {
        miqOnLazyReadGetNodeChildren(node, options.tree_name, options.controller);
      }
    },
    onPostInit: function(isReloading, isError) {
      if (options.silent_activate) {
        miqDynatreeActivateNodeSilently(options.tree_name, options.select_node);
      }
    },
    debugLevel: 0
  });

  if (options.reselect_node) {
    miqDynatreeActivateNodeSilently(options.tree_name, options.reselect_node);
  }

  if (options.expand_parent_nodes) {
    miqExpandParentNodes(options.tree_name, options.expand_parent_nodes);
  }

  if (options.add_nodes) {
    miqAddNodeChildren(
      options.active_tree,
      options.add_node_key,
      options.select_node,
      options.children
    );
  }

  if (options.onhover) {
    miqBindHoverEvent(options.tree_name);
  }

}
