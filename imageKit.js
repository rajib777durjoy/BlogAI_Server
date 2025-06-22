const imageKit= require('imagekit');

const IMAGE_KIT_API_kEY= new imageKit({
    privateKey:process.env.ImageKit_Privet_key,
    publicKey:process.env.ImageKit_Public_key,
    urlEndpoint:process.env.Imagekit_Url_endPoint_key
})

module.exports=IMAGE_KIT_API_kEY;