const path = require('path');
const { EmbedBuilder } = require('discord.js');
const fileManager = require('../../utils/fileManager.js');

// Chargement de la configuration
const configPath = path.join(__dirname, '../../config/config.json');
const config = fileManager.loadJson(configPath, {});

// Définition du chemin du fichier JSON du Styx
const jsonPath = path.join(__dirname, '../../data/styx.json');

// Chargement du fichier JSON via fileManager (initialisé avec un tableau vide si inexistant)
let styxjson = fileManager.loadJson(jsonPath, []);

module.exports = {
  async execute(interaction) {
    // Récupération du membre ciblé via l'option "membre"
    const userOption = interaction.options.getUser('membre');
    const id = userOption.id;
    let userIsInStyx = false;
    let indice;

    // Recherche dans le tableau si l'utilisateur existe déjà dans le Styx
    for (let i = 0; i < styxjson.length; i++) {
      if (styxjson[i].name === userOption.username) {
        userIsInStyx = true;
        indice = i;
        break;
      }
    }

    // Création de l'embed pour la réponse
    const embed = new EmbedBuilder().setColor('#FFA500');

    // Récupérer l'objet rôle Styx depuis le cache du serveur
    const styxRole = interaction.guild.roles.cache.get(config.styxRole);
    if (!styxRole) {
      console.error('Le rôle Styx n’a pas été trouvé sur ce serveur. Vérifiez la configuration.', config.styxRole);
      return interaction.reply({
        content: 'Erreur: Le rôle Styx n’a pas été trouvé sur ce serveur.',
        ephemeral: true,
      });
    }

    if (userIsInStyx) {
      // L'utilisateur est déjà dans le Styx : il récupère ses anciens rôles qui avaient été enregistrés
      try {
        const member = await interaction.guild.members.fetch(id);
        // Réattribution des anciens rôles stockés (sauf le rôle Styx)
        for (const roleId of styxjson[indice].role) {
          const role = interaction.guild.roles.cache.get(roleId);
          if (role && role.editable) {
            await member.roles.add(role);
          } else {
            console.log(`Impossible d’ajouter le rôle ${roleId} à ${member.user.username} (non trouvable ou non editable).`);
          }
        }
        embed
          .setTitle('<:info:1343582548353089537> Styx Enlevé')
          .setDescription(`*Vous venez d'enlever* **${member.user.username}** *du Styx*`)
          .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png');
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        // Retrait du rôle Styx
        if (styxRole.editable) {
          await member.roles.remove(styxRole);
        } else {
          console.log(`Le rôle Styx (${styxRole.id}) n'est pas modifiable pour ${member.user.username}.`);
        }
        // Suppression des données de l'utilisateur dans le tableau JSON
        styxjson.splice(indice, 1);
        // Sauvegarde du tableau mis à jour dans le fichier JSON via fileManager
        fileManager.saveJson(jsonPath, styxjson);
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Erreur lors de la modification des rôles.', ephemeral: true });
      }
    } else {
      // L'utilisateur n'est pas dans le Styx : on le place dans le Styx
      try {
        const member = await interaction.guild.members.fetch(id);
        let rolesToRemove = [];
        // Récupération des rôles à supprimer :
        // Exclure le rôle protégé et le rôle @everyone (dont l'ID correspond à l'ID du serveur)
        member.roles.cache.forEach(role => {
          if (role.id !== config.protectedRole && role.id !== interaction.guild.id) {
            rolesToRemove.push(role.id);
          }
        });
        
        for (const roleId of rolesToRemove) {
          const role = interaction.guild.roles.cache.get(roleId);
          // Vérifier si le rôle est modifiable par le bot
          if (role && role.editable) {
            await member.roles.remove(role);
          }
        }
        // Attribution du rôle Styx
        if (styxRole.editable) {
          await member.roles.add(styxRole);
        }
        // Sauvegarde des rôles supprimés dans le tableau JSON
        styxjson.push({
          name: member.user.username,
          role: rolesToRemove,
        });
        embed
          .setTitle('<:info:1343582548353089537> Styx Ajouté')
          .setDescription(`*Vous venez d'envoyer* **${member.user.username}** *au Styx*`)
          .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        // Sauvegarde du tableau mis à jour via fileManager
        fileManager.saveJson(jsonPath, styxjson);
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Erreur lors de la modification des rôles.', ephemeral: true });
      }
    }
  }
};
