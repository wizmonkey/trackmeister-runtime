//account lists
<View style={styles.item}>
<Text style={styles.text}>
    Choose Language
</Text>
</View>
<View style={styles.item}>
<Text style={styles.text}>
    Support
</Text>
</View>
<Divider style={{backgroundColor: 'black', height: 1}}/>
<View style={styles.item}>
<Text style={styles.text}>
    Choose Theme
</Text>
</View>
<View style={styles.item}>
<Text style={styles.text}>
    About
</Text>
</View>

//login
if (!email || !password) {
    Alert.alert('Please enter an email and password');
    return;
  }
  if (!isValidEmail(email)) {
    Alert.alert('Please enter a valid email address');
    return;
  }

  if (!isValidPassword(password)) {
    Alert.alert('Incorrect Password');
    return;
  }

  //
  const isValidEmail = (email) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  };
  
  const isValidPassword = (password) => {
    return password.length >= 6;
  };s