let r_prompt = ` Please categorize this information into the following resume sections:
1. Personal Details (Mobile Number, Email, LinkedIn)      

provide me with only personal details
if i ask you anything give me in the proper JSON format like

{
    "personal details": {
      "name": "SHITENDU MISHRA",
      "email": "shitendumishra@gmail.com",
      "mobile number": "+91-8874260033",
      "linkedin": "LinkedIn" 
    }
    }
    
`

export default r_prompt