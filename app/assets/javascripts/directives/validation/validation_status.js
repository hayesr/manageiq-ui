ManageIQ.angular.app.directive('validationStatus', function() {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.validationRequired = function (modelValue, viewValue) {
        if (angular.isDefined(viewValue) && viewValue === true) {
          return true;
        }
        return false;
      };
    }
  }
});
