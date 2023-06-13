let express = require('express');
let app = express();
/**
 * public - имя папки где хранится статика
 */
app.use(express.static('public'));
/**
 *  задаем шаблонизатор
 */
app.set('view engine', 'pug');
/**
* Подключаем mysql модуль
*/
let mysql = require('mysql');
/**
* настраиваем модуль
*/

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const nodemailer=require('nodemailer');

let con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database : 'market'
});
process.env["NODE_TLS_REJECT_UNAUTHORIZED"]=0;

app.listen(3000, function () {
    console.log('node express work on 3000');
});

app.get('/', function (req, res) {
  let cat= new Promise (function(resolve,reject){
    con.query("select id,name, cost, image, category from (select id,name,cost,image,category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   from goods, ( select @curr_category := '' ) v ) goods where ind < 3",
    function(err,result,field){
      if (err) reject(err);
      resolve(result);
    })
  });
  let catDiscription= new Promise (function(resolve,reject){
    con.query("SELECT * FROM category",
    function(err,result,field){
      if (err) reject(err);
      resolve(result);
    })
  });
  Promise.all([cat,catDiscription]).then(function(value){
    console.log(value[0]);
    res.render('index',{
      discription:JSON.parse(JSON.stringify(value[0])),
      category:JSON.parse(JSON.stringify(value[1])),
    })
  })

});

app.get('/cat',function(req,res){
let catId=req.query.id;
console.log(catId);

let cat = new Promise(function(resolve,reject){
  con.query('SELECT * FROM category where id='+catId,function(err,result){
    if (err) reject(err);
    resolve(result);
  })
})

let goods = new Promise(function(resolve,reject){
  con.query('SELECT * FROM goods where category='+catId,function(err,result){
    if (err) reject(err);
    resolve(result);
  })
})

Promise.all([cat,goods]).then(function([cat,goods]){
  console.log(cat,77777,goods);
  res.render('cat',{
    cat:JSON.parse(JSON.stringify(cat)),
    goods:JSON.parse(JSON.stringify(goods))
  });
  })
})


app.get('/goods',function(req,res){
  let currentID=req.query.id;
  console.log(currentID);
  con.query('SELECT * FROM goods where id='+currentID,function(err,result){
    if(err) throw err;
    console.log(222,JSON.parse(JSON.stringify(result)),222);
    res.render('goodItem',{
      goods:JSON.parse(JSON.stringify(result))
    });
  })
});

app.get('/order',function(req,res){
    res.render('order')
});

app.post('/get-category-list',function(req,res){
  con.query('SELECT id,category FROM category ',function(err,result){
    if(err) throw err;
    console.log(result);
    res.json(result);
  })
});


app.post('/get-goods-info',function(req,res){
console.log(req.body);
con.query('SELECT id,name,cost FROM goods WHERE id IN ('+req.body.key.join(',')+')',
function (err,result,field){
  if(err) throw err;
  let goods={};
  for(let z=0;z<result.length;z++){
    goods[result[z]['id']]=result[z];
  }
  console.log(goods);
  res.json(goods);
})
});


app.post('/finish-order',function(req,res){
  console.log(req.body);
  if(req.body.key.length!=0){
    let key =Object.keys(req.body.key);
    con.query(
      'SELECT id,name,cost FROM goods WHERE id IN ('+key.join(',')+')',
    function (err,result,field){
    if(err) throw err;
    sendMail(req.body,result).catch(console.error());
    saveOrder(req.body,result);
    res.send('1');
    });
  }
  else{
    res.send('0');
  }
 
})

function saveOrder(data,result){
// data is user info
//result is goods info

let sql;
sql="INSERT INTO user_info (user_name, user_phone, user_email,address) VALUES ('"+data.username+"','"+data.phone+"','"+data.email+"','"+data.address+"')";
con.query(sql,function(err,resultQuery){
  if(err) throw err;
  console.log('1 user info saved');
  console.log(resultQuery);
  let userId=resultQuery.insertId;
  date=new Date()/1000;
  for(let i=0;i<result.length;i++){
sql="INSERT INTO shop_order (date, user_id, goods_id, goods_cost, goods_amount, total) VALUES ("+date+","+userId+","+result[i]['id']+","+result[i]['cost']+","
+data.key[result[i]['id']]+","+data.key[result[i]['id']]*result[i]['cost']+")";
con.query(sql,function(err,resultQuery){
  if(err) throw err;
  console.log("1 goods saved");
})

  }
})
}


async function sendMail(data,result){
  let res='<h2>Order in lite shop</h2>';
  let total=0;
  for(let i=0;i<result.length;i++){
    res+=`<p>${result[i]['name']}-${data.key[result[i]['id']]}-${result[i]['cost']*data.key[result[i]['id']]}</p>`
    total+=result[i]['cost']*data.key[result[i]['id']];
  }
  console.log(res);
  res+='<hr>';
  res+=`Total${total}`;
  res+=`<hr>Phone:${data.phone}`;
  res+=`<hr>Username:${data.username}`;
  res+=`<hr>Address:${data.address}`;
  res+=`<hr>Email:${data.email}`;
  let testAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  let mailOption={
    from:'<mrhaps2.0@gmail.com>',
    to:"mrhaps2.0@gmail.com,"+data.email,
    subject:"lite shop order",
    text:'Hello world',
    html:res
  };
  let info =await transporter.sendMail(mailOption);
  console.log("MessageSent:%s",info.messageId);
  console.log("PreviewSent:%s",nodemailer.getTestMessageUrl(info));
  return true;
}

app.get('/admin',function(req,res){
    res.render('admin',{
    });
  })


app.get('/login',function(req,res){
    res.render('login',{
    });
})

app.post('/login',function(req,res){
  console.log('=========================');
  console.log(req.body);
  console.log(req.body.login);
  console.log(req.body.password);
  console.log('=========================');
  con.query(
    'SELECT * FROM users WHERE login="'+req.body.login + '" and password="'+req.body.password+'"',
    function (error,result){
      if(error) throw error;
      if(result.length==0){
        console.log('error user does not existed');
        res.redirect('/login');
      }
      else{
        result=JSON.parse(JSON.stringify(result));
        res.cookie('hash','blablabla');
        // res.render('work2');
        sql="UPDATE users SET hash='blablabla' WHERE id="+result[0]['id'];
        con.query(sql,function(error,resultQuery){
          if(error) throw error;
          res.redirect('/admin');
        })
      }
      console.log(result);
    }
  )
})


  app.get('/admin-order',function(req,res){
    con.query(
    `SELECT
      shop_order.id as id,
      shop_order.user_id as user_id,
      shop_order.goods_id as goods_id,
      shop_order.goods_cost as goods_cost,
      shop_order.goods_amount as goods_amount,
      shop_order.total as total,
      from_unixtime(date,"%Y-%m-%d %h:%m") as human_date,
      user_info.user_name as user,
      user_info.user_phone as phone,
      user_info.address as address
    FROM 
      shop_order
    LEFT JOIN
      user_info
    ON shop_order.user_id=user_info.id ORDER BY id DESC`,function(err,result){
      if(err) throw err;
      res.render('admin-order',{
        order:JSON.parse(JSON.stringify(result))
      });
    })
  })
