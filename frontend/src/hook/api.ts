import axios from "axios";

const server = "https://froud-detection.onrender.com/api/v1"
// const server = "http://10.0.2.2:8000/api/v1"
export const loadUser = async () => {
    try {

    


        // Axios
        const res = await axios.get(`${server}/me`, {
            "withCredentials": true
        })



        return res.data
    } catch (error:any) {
 
        return error.response
    }

}

export const login = async (phone:string, password:string) => {
    try {

        // Axios
        const res = await axios.post(`${server}/login`, {
            phone, password
        }, {
            headers: {
                "Content-Type": "application/json"
            },
            "withCredentials": true
        })



        return res.data

    } catch (error) {
       
        return error.response.data.message

    }
}

export const loadUserList = async () => {
    try {


        // Axios
        const res = await axios.get(`${server}/user-list`, {
            "withCredentials": true
        })


        return res.data
    } catch (error) {
      
        return error.response.data
    }

}

export const sendTokenToServer = async (token:string) => {
    try {

       
        const res = await axios.post(`${server}/save-token`,
            { token }, {
            headers: {
                "Content-Type": "application/json"
            },
            "withCredentials": true
        }
        );
     
    } catch (error) {
        console.error('Failed to send device token to server:', error);
    }
};
