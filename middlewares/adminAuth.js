const adminAuthentication = async(req,res,next)=>{
    try{
        if (req.session && req.session.admin && req.session.admin.isAdmin === 1 && req.session.admin.isVerified === 1) {
            next()
    }
    else{
        res.redirect('/adminLogin')
    }
    }
    catch(error){
        console.log(error.message)
    }

}




module.exports = adminAuthentication

    
