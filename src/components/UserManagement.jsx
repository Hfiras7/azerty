import React, { useState, useEffect } from 'react';
import { getAllUsers, createUserAccount, updateUser, deleteUser } from '../config/supabase';
import './UserManagement.css';

const UserManagement = ({ currentUser, onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      alert('❌ Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Validation
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      alert('⚠️ Tous les champs sont requis');
      return;
    }

    if (newUser.password.length < 6) {
      alert('⚠️ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!newUser.email.includes('@')) {
      alert('⚠️ Email invalide');
      return;
    }

    try {
      await createUserAccount(
        newUser.email,
        newUser.password,
        newUser.displayName,
        newUser.role
      );

      alert('✅ Compte créé avec succès !');
      setShowCreateForm(false);
      setNewUser({ email: '', password: '', displayName: '', role: 'user' });
      await loadUsers();
    } catch (error) {
      console.error('Erreur création:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser.id) {
      alert('⚠️ Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${userEmail} ?`)) {
      return;
    }

    try {
      await deleteUser(userId);
      alert('✅ Utilisateur supprimé');
      await loadUsers();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin_master':
        return 'role-badge role-master';
      case 'admin_teacher':
        return 'role-badge role-teacher';
      case 'user':
        return 'role-badge role-user';
      default:
        return 'role-badge';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin_master':
        return '👑 Admin Master';
      case 'admin_teacher':
        return '👨‍🏫 Admin Teacher';
      case 'user':
        return '👤 Notateur';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading">⏳ Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <button onClick={onBack} className="back-button">
          ← Retour
        </button>
        <h2>👥 Gestion des Utilisateurs</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="create-user-button"
        >
          + Créer un Compte
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Créer un Nouveau Compte</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="utilisateur@exemple.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mot de passe * (min. 6 caractères)</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••"
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom d'affichage *</label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div className="form-group">
                <label>Rôle *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  <option value="user">👤 Notateur (user)</option>
                  <option value="admin_teacher">👨‍🏫 Admin Teacher (notation + progression)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-create">
                  ✅ Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-list">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.display_name}</td>
                <td>
                  <span className={getRoleBadgeClass(user.role)}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                  {user.id !== currentUser.id && user.role !== 'admin_master' && (
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="btn-delete"
                      title="Supprimer cet utilisateur"
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      <div className="user-management-info">
        <p>
          <strong>📌 Note :</strong> Vous pouvez créer des comptes <em>Notateur (user)</em> et{' '}
          <em>Admin Teacher</em>. Les comptes Admin Master doivent être créés directement dans Supabase.
        </p>
      </div>
    </div>
  );
};

export default UserManagement;
