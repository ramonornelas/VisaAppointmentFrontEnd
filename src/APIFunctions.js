const UserDetails = async (userid) => {
    try {
      const response = await fetch(`https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/users/${userid}`, {
        method: 'GET',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });
  
      if (response.status === 200) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
};

const otherFunction = async () => {
  // Another API call or function
};

export { UserDetails, otherFunction };
