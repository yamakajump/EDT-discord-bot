/**
 * Module de commande "calcul"
 *
 * Cette commande slash est conçue pour effectuer différents calculs liés à la nutrition
 * et à la performance sportive. Elle comporte plusieurs sous-commandes :
 *
 * - calories : Estime les besoins caloriques quotidiens en fonction de divers paramètres.
 * - imc      : Calcule l'indice de masse corporelle (IMC).
 * - macro    : Détermine la répartition des macronutriments en fonction des besoins caloriques.
 * - maxrep   : Calcule le poids maximum pour une répétition (1RM).
 * - glp      : Calcule l'indice GLP en Force Athlétique.
 *
 * La logique d'exécution consiste à charger dynamiquement le fichier relatif à la sous-commande
 * sélectionnée par l'utilisateur (dans le dossier "calcul/") et à exécuter sa fonction "execute".
 *
 * Pour ajouter une nouvelle sous-commande, il suffit de compléter le builder et de créer le fichier
 * correspondant dans le dossier "calcul".
 */

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calcul')
        .setDescription('Commandes pour effectuer divers calculs.')
        // Sous-commande : calories
        .addSubcommand(subcommand =>
            subcommand
                .setName('calories')
                .setDescription("Estime vos besoins caloriques quotidiens.")
                .addNumberOption(option =>
                    option.setName('poids')
                        .setDescription('Votre poids en kg.')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('taille')
                        .setDescription('Votre taille en cm.')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('age')
                        .setDescription('Votre âge.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('sexe')
                        .setDescription('Votre sexe.')
                        .addChoices(
                            { name: 'Homme', value: 'H' },
                            { name: 'Femme', value: 'F' }
                        )
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('nap')
                        .setDescription("Votre niveau d'activité physique en dehors du sport.")
                        .addChoices(
                            { name: "Sédentaire (peu ou pas d'exercice)", value: "S" },
                            { name: "Peu actif (exercice léger ou sport 1-3 jours par semaine)", value: "P" },
                            { name: "Actif (exercice modéré ou sport 3-5 jours par semaine)", value: "A" },
                            { name: "Très actif (exercice intense ou sport 6-7 jours par semaine)", value: "T" },
                        )
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('temps')
                        .setDescription("Votre temps d'entraînement journalier en minutes.")
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('tef')
                        .setDescription("Votre TEF : 10 pour des aliments ultra-transformés, 25 pour des aliments non-transformés.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('objectif')
                        .setDescription("Votre objectif nutritionnel.")
                        .addChoices(
                            { name: 'Sèche', value: 'seche' },
                            { name: 'Maintien', value: 'maintien' },
                            { name: 'Prise de masse', value: 'pdm' }
                        )
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('pourcentage')
                        .setDescription("Pourcentage personnalisé (ex : 80 pour 80%). Pour maintien, 100 ou rien.")
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('ajustement')
                        .setDescription("Ajoutez ou retirez directement un nombre de calories (ex : 200 pour +200, -200 pour -200).")
                        .setRequired(false)
                )
        )
        // Sous-commande : imc
        .addSubcommand(subcommand =>
            subcommand
                .setName('imc')
                .setDescription("Calcule votre indice de masse corporelle (IMC).")
                .addNumberOption(option =>
                    option.setName('poids')
                        .setDescription("Votre poids en kg.")
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('taille')
                        .setDescription("Votre taille en cm.")
                        .setRequired(true)
                )
        )
        // Sous-commande : macro
        .addSubcommand(subcommand =>
            subcommand
                .setName('macro')
                .setDescription("Calcule la répartition des macronutriments en fonction de vos besoins caloriques.")
                .addNumberOption(option =>
                    option.setName('calories')
                        .setDescription("Vos besoins caloriques journaliers en kcal.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('objectif')
                        .setDescription("Votre objectif nutritionnel.")
                        .setRequired(true)
                        .addChoices(
                            { name: 'Perte de poids', value: 'perte' },
                            { name: 'Maintien', value: 'maintien' },
                            { name: 'Prise de masse', value: 'prise' },
                            { name: 'Recomposition corporelle', value: 'recomp' }
                        )
                )
                .addStringOption(option =>
                    option.setName('sexe')
                        .setDescription("Votre sexe.")
                        .addChoices(
                            { name: 'Homme', value: 'H' },
                            { name: 'Femme', value: 'F' }
                        )
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('etat')
                        .setDescription("Indiquez si vous vous considérez comme maigre ou grasse.")
                        .addChoices(
                            { name: 'Maigre', value: 'maigre' },
                            { name: 'Grasse', value: 'grasse' }
                        )
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('proteines')
                        .setDescription("Pourcentage de protéines personnalisé.")
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('glucides')
                        .setDescription("Pourcentage de glucides personnalisé.")
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('lipides')
                        .setDescription("Pourcentage de lipides personnalisé.")
                        .setRequired(false)
                )
        )
        // Sous-commande : maxrep
        .addSubcommand(subcommand =>
            subcommand
                .setName('maxrep')
                .setDescription("Calcule votre poids maximum pour une répétition (1RM).")
                .addNumberOption(option =>
                    option.setName('poids')
                        .setDescription("Le poids utilisé en kg.")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('reps')
                        .setDescription("Le nombre de répétitions effectuées.")
                        .setRequired(true)
                )
        )
        // Sous-commande : glp
        .addSubcommand(subcommand =>
            subcommand
                .setName('glp')
                .setDescription("Calcule l'indice GLP en Force Athlétique.")
                .addStringOption(option =>
                    option.setName('sexe')
                        .setDescription('Votre sexe.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Homme', value: 'M' },
                            { name: 'Femme', value: 'F' }
                        )
                )
                .addStringOption(option =>
                    option.setName('equipement')
                        .setDescription("Votre équipement.")
                        .setRequired(true)
                        .addChoices(
                            { name: 'Raw', value: 'Raw' },
                            { name: 'Single-ply', value: 'Single-ply' }
                        )
                )
                .addStringOption(option =>
                    option.setName('mouvements')
                        .setDescription("Sélectionnez vos mouvements.")
                        .setRequired(true)
                        .addChoices(
                            { name: 'SBD', value: 'SBD' },
                            { name: 'Bench Only', value: 'B' }
                        )
                )
                .addNumberOption(option =>
                    option.setName('bodyweight')
                        .setDescription("Votre poids en kg.")
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('total')
                        .setDescription("Votre total en kg.")
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        // Récupération de la sous-commande sélectionnée par l'utilisateur
        const subcommand = interaction.options.getSubcommand();

        try {
            // Chargement dynamique du fichier correspondant à la sous-commande
            const subcommandFile = require(path.join(__dirname, 'calcul', `${subcommand}.js`));
            await subcommandFile.execute(interaction);
        } catch (error) {
            console.error(`Erreur lors de l'exécution de la sous-commande ${subcommand}:`, error);
            await interaction.reply({
                content: `Une erreur est survenue lors de l'exécution de la commande ${subcommand}.`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
