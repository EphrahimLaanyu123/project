import React from 'react'
import { userau }
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({children}) => {
  const {session} = userAuth();

    if (session === undefined) {
        return <p>Loading...</p>
    }

  return <>{session ? <>{children}</> : <Navigate to='/signup'/>} </>
}

export default PrivateRoute