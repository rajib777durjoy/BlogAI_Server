const ImageKit =require('imagekit');
require('dotenv').config();
const IMAGE_KIT_API_kEY= new ImageKit({
    publicKey:"public_1wZyNsEpqOSQiZ8My5wS3MpRRL8=",
    privateKey:"private_8xLceCQ9jlw2tR9vkKdV7rBHZMQ=",
    urlEndpoint:"https://ik.imagekit.io/wq3wgfzjk"
})

module.exports=IMAGE_KIT_API_kEY;