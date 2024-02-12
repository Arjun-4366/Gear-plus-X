const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth2').Strategy

    passport.serializeUser((user,done)=>{
        done(null,user)
    })

    passport.deserializeUser((user,done)=>{
        done(null,user)
    })

    passport.use(new GoogleStrategy({
        clientID:process.env.CLLIENT_ID,
        clientSecret:process.env.CLLIENT_SECRET,
        callbackURL:'http://localhost:3002/auth/google/callback',
        passReqToCallback:true
    },
    function(request,accessToken,refreshToken,profile,done){
        return done (null,profile)
    }
    ))

   
    module.exports = passport