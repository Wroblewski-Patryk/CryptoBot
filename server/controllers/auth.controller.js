const bcrypt = require('bcrypt');
const generateToken = require('../core/generateToken');

const mockUser = {
  id: 1,
  username: 'admin',
  passwordHash: bcrypt.hashSync('admin123', 10)
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (username !== mockUser.username) {
    return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika' });
  }

  const isMatch = await bcrypt.compare(password, mockUser.passwordHash);
  if (!isMatch) return res.status(401).json({ message: 'Nieprawidłowe hasło' });

  try {
    const token = generateToken(mockUser.id);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Błąd przy logowaniu' });
  }
};