/**
 * Created by yuanmingzhou on 8/26/16.
 */


var cartController = function($scope){
    $scope.cart = [
        {
            id:1000,
            name:'iphone5s',
            quantity:3,
            price:4300
        },
        {
            id:3000,
            name:'iphone53',
            quantity:30,
            price:3300
        },
        {
            id:500,
            name:'mac',
            quantity:10,
            price:23000
        },
        {
            id:300,
            name:'ipad',
            quantity:5,
            price:6900
        }
    ];

    $scope.totalPrice = function () {
        var total = 0;
        angular.forEach($scope.cart,function (item) {
            total += item.quantity * item.price;
        })
        return total;
    }

    $scope.totalQuantity = function () {
        var total = 0;
        angular.forEach($scope.cart,function (item) {
            total += parseInt(item.quantity);
        })
        return total;
    }



    var findIndex = function (id) {
        var index = -1;
        angular.forEach($scope.cart, function(item, key){
            if (item.id === id){
                index = key;
                return;
            }
        });

        return index;

    }

    $scope.add = function (id) {
        var index = findIndex(id);

        if (index !== -1){
            ++$scope.cart[index].quantity;
        }
    }

    $scope.reduce = function (id) {
        var index = findIndex(id);

        if (index !== -1){
            var item = $scope.cart[index];
            if (item.quantity > 1){
                --item.quantity;
            }else{
                var returnKey = confirm("Do you want remove this item?");
                if (returnKey){
                    $scope.remove(id);
                }
            }

        }
    }

    $scope.remove = function(id){
        var index = -1;
        angular.forEach($scope.cart, function(item, key){
            if (item.id === id){
                index = key;
            }
        });

        if ( index !== -1){
            $scope.cart.splice(index,1);
        }

    }

    $scope.$watch('cart', function (newValue, oldValue) {
        angular.forEach(newValue, function(item, key) {
            if (item.quantity < 1){
                var returnKey = confirm("Do you want remove this item?");
                if (returnKey){
                    $scope.remove(item.id);
                }else{
                    item.quantity = oldValue[key].quantity;
                }
                return;
            }
        })
    },true)
}