ManageIQ.angular.app.controller('arbitrationProfileFormController', ['$http', '$scope', '$location', 'arbitrationProfileFormId', 'miqService', 'postService', 'arbitrationProfileData', 'API', function($http, $scope, $location, arbitrationProfileFormId, miqService, postService, arbitrationProfileData, API) {
    var init = function() {
      $scope.arbitrationProfileModel = {
        name: '',
        description: '',
        ems_id: emsId,
        authentication_id: '',
        availability_zone_id: '',
        cloud_network_id: '',
        cloud_subnet_id: '',
        flavor_id: '',
        security_group_id: ''
      };
      $scope.formId    = arbitrationProfileFormId;
      $scope.afterGet  = false;
      $scope.model     = "arbitrationProfileModel";
      ManageIQ.angular.scope = $scope;

      if (arbitrationProfileFormId == 'new') {
        $scope.newRecord = true;
        $scope.arbitrationProfileModel.ems_id = emsId;
      } else {
        $scope.newRecord = false;
        $scope.arbitrationProfileModel.name                 = arbitrationProfileData.name;
        $scope.arbitrationProfileModel.description          = arbitrationProfileData.description;
        $scope.arbitrationProfileModel.authentication_id    = convertToString(arbitrationProfileData.authentication_id);
        $scope.arbitrationProfileModel.availability_zone_id = convertToString(arbitrationProfileData.availability_zone_id);
        $scope.arbitrationProfileModel.cloud_network_id     = convertToString(arbitrationProfileData.cloud_network_id);
        $scope.arbitrationProfileModel.cloud_subnet_id      = convertToString(arbitrationProfileData.cloud_subnet_id);
        $scope.arbitrationProfileModel.flavor_id            = convertToString(arbitrationProfileData.flavor_id);
        $scope.arbitrationProfileModel.security_group_id    = convertToString(arbitrationProfileData.security_group_id);
      }

      $scope.profileOptions($scope.arbitrationProfileModel.ems_id, $scope.arbitrationProfileModel.cloud_network_id);
      $scope.modelCopy = angular.copy( $scope.arbitrationProfileModel );
    };

  $scope.cancelClicked = function() {
    var task = $scope.newRecord ? "Add" : "Edit"
    var msg = sprintf(__(task + " of Arbitration Profile %s was cancelled by the user"), $scope.arbitrationProfileModel.description);
    postService.cancelOperation(redirectUrl, msg);
    $scope.angularForm.$setPristine(true);
  };

  $scope.resetClicked = function() {
    $scope.arbitrationProfileModel = angular.copy( $scope.modelCopy );
    $scope.profileOptions($scope.arbitrationProfileModel.ems_id, $scope.arbitrationProfileModel.cloud_network_id);
    $scope.angularForm.$setUntouched(true);
    $scope.angularForm.$setPristine(true);
    miqService.miqFlash("warn", __("All changes have been reset"));
  };

  $scope.saveClicked = function() {
    var successMsg = sprintf(__("Arbitration Profile %s was saved"), $scope.arbitrationProfileModel.name);
    postService.saveRecord('/api/arbitration_profiles/' + arbitrationProfileFormId,
      redirectUrl,
      setProfileOptions(),
      successMsg);
    $scope.angularForm.$setPristine(true);
  };

  $scope.addClicked = function($event, formSubmit) {
    var successMsg = sprintf(__("Arbitration Profile %s was added"), $scope.arbitrationProfileModel.name);
    postService.createRecord('/api/arbitration_profiles',
      redirectUrl,
      setProfileOptions(),
      successMsg);
    $scope.angularForm.$setPristine(true);
  };

  // extract ems_id from url
  var emsId = (/ems_cloud\/arbitration_profile_edit\/(\d+)/.exec($location.absUrl())[1]);
  var redirectUrl = '/ems_cloud/arbitration_profiles/' + emsId + '?db=ems_cloud';

  var convertToString = function(id) {
    if(angular.isDefined(id)) {
      return id.toString();
    }
    return '';
  }

  var setProfileOptions = function() {
    return {
              name:                 $scope.arbitrationProfileModel.name,
              description:          $scope.arbitrationProfileModel.description,
              ems_id:               $scope.arbitrationProfileModel.ems_id,
              authentication_id:    $scope.arbitrationProfileModel.authentication_id,
              availability_zone_id: $scope.arbitrationProfileModel.availability_zone_id,
              cloud_network_id:     $scope.arbitrationProfileModel.cloud_network_id,
              cloud_subnet_id:      $scope.arbitrationProfileModel.cloud_subnet_id,
              flavor_id:            $scope.arbitrationProfileModel.flavor_id,
              security_group_id:    $scope.arbitrationProfileModel.security_group_id
            }
  }

  $scope.cloudNetworkChanged = function(id) {
    var url = "/api/cloud_networks/" + id + "?attributes=cloud_subnets,security_groups";

    API.get(url).then(function(response) {
      $scope.arbitrationProfileModel.cloud_subnets   = response.cloud_subnets;
      $scope.arbitrationProfileModel.security_groups = response.security_groups;
    })
  };

  $scope.profileOptions = function(id, cloud_network_id) {
    var url = "/api/providers/" + id + "?attributes=authentications,availability_zones,cloud_networks,cloud_subnets,flavors,security_groups";

    API.get(url).then(function(response) {
      $scope.arbitrationProfileModel.authentications   = response.authentications;
      $scope.arbitrationProfileModel.availability_zones = response.availability_zones;
      $scope.arbitrationProfileModel.flavors   = response.flavors;
      $scope.arbitrationProfileModel.cloud_networks = response.cloud_networks;
      if(cloud_network_id != "") {
        $scope.cloudNetworkChanged(cloud_network_id)
      } else {
        $scope.arbitrationProfileModel.cloud_subnets   = response.cloud_subnets;
        $scope.arbitrationProfileModel.security_groups = response.security_groups;
      }
    })
  };

  init();
}]);
