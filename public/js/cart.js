let cart={};
document.querySelectorAll('.add-to-cart').forEach(function(el){
    el.onclick= addToCart;
})

if(localStorage.getItem('cart')){
    cart=JSON.parse(localStorage.getItem('cart'));
    ajaxGetGoodsInfo();
}

function addToCart(){
    let goodsId=this.dataset.goods_id;
    if(cart[goodsId]){
        cart[goodsId]++;
    }
    else{
        cart[goodsId]=1;
    }
    console.log(cart);
    ajaxGetGoodsInfo();
}

function  ajaxGetGoodsInfo() {
    updateLocalStortage();
    fetch('/get-goods-info',{
        method:'POST',
        body:JSON.stringify({key:Object.keys(cart)}),
        headers:{
            'Accept':'application/json',
            'Content-Type':'application/json'
        }
    })
    .then(function(res){
        return res.text();
    })
    .then(function(body){
        console.log(body);
        showCart(JSON.parse(body));
    })
}


function showCart(data){
    let out = '<table class="table table-striped table-cart"><tbody>';
    let total=0;
    for (let key in cart){
        out+=`<tr><td colspan="4" ><a href="/goods?id=${key}">${data[key]['name']}</a></tr>`;
        out+=`<tr><td><i class="far fa-minus-square cart-minus" data-goods_id="${key}"</i></td>`;
        out+=`<td>${cart[key]}</td>`;
        out+=`<td><i class="far fa-plus-square cart-plus" data-goods_id="${key}"></i></td>`;
        out+=`<td>${data[key]['cost']*cart[key]} </td>`;
        out+='</tr>';
        total+=cart[key]*data[key]['cost'];
    }
    out+=`<tr><td colspan="3"> Total: </td><td>${total}</td></tr>`;
    out+='</tbody></table>';
    document.querySelector('#cart-nav').innerHTML=out;
    document.querySelectorAll('.cart-minus').forEach(function(el){
        el.onclick=cartMinus;
    });
    document.querySelectorAll('.cart-plus').forEach(function(el){
        el.onclick=cartPlus;
    });

    function cartMinus(){
        let goodsId=this.dataset.goods_id;
        if(cart[goodsId]-1>0){
            cart[goodsId]--;
            ajaxGetGoodsInfo();
        }
        else{
            delete(cart[goodsId]);
            if(JSON.stringify(cart)==='{}'){
                document.querySelector('#cart-nav').innerHTML='';
            }
            else{
                ajaxGetGoodsInfo();
            }
        }

    }
    
    function cartPlus(){
        let goodsId=this.dataset.goods_id;
        cart[goodsId]++;
        ajaxGetGoodsInfo();
    }
}



function updateLocalStortage(){
    localStorage.setItem('cart',JSON.stringify(cart));
}