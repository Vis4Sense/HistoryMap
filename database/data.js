// Creating the Schemas
var Schema = mongoose.Schema;
var statusSchema = new Schema({ text: 'string' })
var userSchema = new Schema({ username: 'string', status: [statusSchema] })                       

//Creating some users, sub-docs and sub-sub-docs
var User = mongoose.model('User', userSchema);

//Adding record 
var user = new User({ username: 'derp', status: [{text: 'Hello world!'}] })
user.save();

//Adding another record 
var friend = new User({ username: 'goku', status: [{text: 'Kamehameha!!!'}] })
friend.save();

user.status.push({
    text: "another"
})
user.save();


//finding the record 
User.findOne({'status.text': 'another'}, function(err, the_user){
    if(err)console.log(err)
    if(the_user){
        console.log(the_user.username); 
    }
})

//show all
User.findOne({}, function(err, the_user){
    if(err)console.log(err)
    if(the_user){
        console.log(the_user.username); 
    }
})

