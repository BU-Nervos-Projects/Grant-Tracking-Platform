import fetch from "node-fetch";
import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, Client, GatewayIntentBits, REST, Routes, Interaction, } from "discord.js";
import { config } from "@/configs/config";

/**
 * ENV
 */

if (!config.discordBotToken || !config.discordAppId || !config.guildId) {
    throw new Error(
        "Missing one of DISCORD_BOT_TOKEN_COMMANDER, DISCORD_APP_ID_COMMANDER, DISCORD_GUILD_ID"
    );
}
if (!config.serviceBotToken) {
    throw new Error("Missing SERVICE_BOT_TOKEN");
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

/**
 * Slash commands
 */
const commands = [
    new SlashCommandBuilder()
        .setName("progress-update")
        .setDescription("Post a progress update for your project"),
    new SlashCommandBuilder()
        .setName("milestone-status")
        .setDescription("Update the status of a milestone"),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.discordBotToken);

async function registerCommands() {
    await rest.put(Routes.applicationGuildCommands(config.discordAppId, config.guildId), {
        body: commands,
    });
    console.log("✅ Slash commands registered for guild.");
}

/**
 * Helpers
 */
type AssignedProject = { id: number; name: string };

async function getAssignedProjects(discordId: string): Promise<AssignedProject[]> {
    const url = `${config.backendUrl}/api/discord/assigned-projects?discord_id=${encodeURIComponent(
        discordId
    )}`;
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`Failed to load assigned projects (${res.status})`);
    return (await res.json()) as AssignedProject[];
}

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        try {
            const j = (await res.json()) as any;
            if (j?.error) throw new Error(j.error);
            if (j?.message) throw new Error(j.message);
            throw new Error(`${res.status} ${res.statusText}`);
        } catch {
            const t = await res.text().catch(() => "");
            throw new Error(t || `${res.status} ${res.statusText}`);
        }
    }
    try {
        return await res.json();
    } catch {
        return null;
    }
}

async function patchJson(url: string, body: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        try {
            const j = (await res.json()) as any;
            if (j?.error) throw new Error(j.error);
            if (j?.message) throw new Error(j.message);
            throw new Error(`${res.status} ${res.statusText}`);
        } catch {
            const t = await res.text().catch(() => "");
            throw new Error(t || `${res.status} ${res.statusText}`);
        }
    }
    try {
        return await res.json();
    } catch {
        return null;
    }
}

/** Safely send to the channel (only if text-based) */
async function safeChannelSend(interaction: Interaction, content: string) {
    if (interaction.channel && typeof (interaction.channel as any).isTextBased === "function") {
        if ((interaction.channel as any).isTextBased()) {
            await (interaction.channel as any).send(content);
        }
    }
}

/** UI builders */
function buildProjectSelect(
    customId: string,
    projects: AssignedProject[],
    placeholder: string
) {
    const options = projects.slice(0, 25).map((p) =>
        new StringSelectMenuOptionBuilder().setLabel(p.name).setValue(String(p.id))
    );

    const select = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .addOptions(options);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

const ALL_STATUSES = ["completed"];

function buildStatusSelect(customId: string) {
    const options = ALL_STATUSES.map((s) =>
        new StringSelectMenuOptionBuilder().setLabel(s).setValue(s)
    );
    const select = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder("Pick a status")
        .addOptions(options);
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

function buildProgressModal(projectId: string, projectName: string) {
    const modal = new ModalBuilder()
        .setCustomId(`progress_modal:${projectId}:${encodeURIComponent(projectName)}`)
        .setTitle("Post a recent update");

    const tiTitle = new TextInputBuilder()
        .setCustomId("title_input")
        .setLabel("Title")
        .setStyle(TextInputStyle.Short)
        .setMinLength(3)
        .setMaxLength(120)
        .setRequired(true);

    const tiDesc = new TextInputBuilder()
        .setCustomId("desc_input")
        .setLabel("Description (optional)")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(2000);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(tiTitle);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(tiDesc);

    modal.addComponents(row1, row2);
    return modal;
}

/**
 * Bot lifecycle
 */
client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
    try {
        // /progress
        if (interaction.isChatInputCommand() && interaction.commandName === "progress-update") {
            const discordId = interaction.user.id;
            const projects = await getAssignedProjects(discordId);

            if (!projects.length) {
                await interaction.reply({
                    ephemeral: true,
                    content: "No projects are assigned to you yet.",
                });
                return;
            }

            const row = buildProjectSelect("pick_project_for_progress", projects, "Select a project");
            await interaction.reply({
                ephemeral: true,
                content: "Choose the project you want to post a recent update for:",
                components: [row],
            });
            return;
        }

        // /milestone
        if (interaction.isChatInputCommand() && interaction.commandName === "milestone-status") {
            const discordId = interaction.user.id;
            const projects = await getAssignedProjects(discordId);

            if (!projects.length) {
                await interaction.reply({
                    ephemeral: true,
                    content: "No projects are assigned to you yet.",
                });
                return;
            }

            const row = buildProjectSelect("pick_project_for_milestone", projects, "Select a project");
            await interaction.reply({
                ephemeral: true,
                content: "Choose the project whose active milestone you want to update:",
                components: [row],
            });
            return;
        }

        // Project picked → show modal (progress)
        // Project picked → show modal (progress)
        if (interaction.isStringSelectMenu() && interaction.customId === "pick_project_for_progress") {
            const projectId = interaction.values?.[0];
            if (!projectId) {
                await interaction.reply({ ephemeral: true, content: "❌ No project selected." }).catch(() => { });
                return;
            }

            // TS-friendly label read
            const label =
                (interaction.component as any)?.options?.find((o: any) => o?.data?.value === projectId)?.data?.label ||
                "Project";

            const modal = buildProgressModal(projectId, label); // now projectId is narrowed to string
            await interaction.showModal(modal);
            return;
        }

        // Project picked → show status (milestone)
        if (interaction.isStringSelectMenu() && interaction.customId === "pick_project_for_milestone") {
            const projectId = interaction.values?.[0];
            if (!projectId) {
                await interaction.reply({ ephemeral: true, content: "❌ No project selected." }).catch(() => { });
                return;
            }

            const label =
                (interaction.component as any)?.options?.find((o: any) => o?.data?.value === projectId)?.data?.label ||
                "Project";

            const statusRow = buildStatusSelect(`set_status:${projectId}:${encodeURIComponent(label)}`);
            await interaction.update({
                content:
                    "Pick a status to apply to the **active milestone**.\n" +
                    "_Note: you can only actually **apply** `completed`. Choosing anything else will just inform you._",
                components: [statusRow],
            });
            return;
        }

        // Status chosen
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("set_status:")) {
            const userId = interaction.user.id;
            const parts = interaction.customId.split(":");
            const projectId = parts[1]; // may be undefined -> guard next
            const projectName = decodeURIComponent(parts[2] || "Project");
            if (!projectId) {
                await interaction.reply({ ephemeral: true, content: "❌ Missing project id." }).catch(() => { });
                return;
            }
            const chosen = interaction.values[0];

            if (chosen !== "completed") {
                await interaction.update({
                    content:
                        `You picked \`${chosen}\`. Via Discord you can only mark the active milestone as \`completed\`. ` +
                        `No changes were made.`,
                    components: [],
                });
                await safeChannelSend(
                    interaction,
                    `ℹ️ **${projectName}** — user <@${userId}> selected status \`${chosen}\` (no change applied).`
                );
                return;
            }

            // Apply "completed"
            await interaction.update({ content: "Updating milestone…", components: [] });

            await patchJson(
                `${config.backendUrl}/api/projects/${projectId}/milestones`,
                { status: "completed", callerDiscordId: userId },
                { Authorization: `Bearer ${config.serviceBotToken}` }
            );

            await safeChannelSend(
                interaction,
                `🎯 **${projectName}** — active milestone **marked completed** by <@${userId}>`
            );

            await interaction
                .followUp({
                    ephemeral: true,
                    content: `Done. Active milestone marked **completed** for **${projectName}**.`,
                })
                .catch(() => { });
            return;
        }

        // Modal submit (progress)
        if (interaction.isModalSubmit() && interaction.customId.startsWith("progress_modal:")) {
            const userId = interaction.user.id;
            const parts = interaction.customId.split(":");
            const projectId = parts[1];
            const projectName = decodeURIComponent(parts[2] || "Project");
            if (!projectId) {
                await interaction.reply({ ephemeral: true, content: "❌ Missing project id." }).catch(() => { });
                return;
            }

            const title = interaction.fields.getTextInputValue("title_input");
            const description = interaction.fields.getTextInputValue("desc_input") || "";

            await interaction.deferReply({ ephemeral: true });

            await postJson(
                `${config.backendUrl}/api/projects/${projectId}/progress`,
                { title, description, callerDiscordId: userId },
                { Authorization: `Bearer ${config.serviceBotToken}` }
            );

            await safeChannelSend(
                interaction,
                [
                    `📝 **${projectName}** — recent update from <@${userId}>`,
                    `**Title:** ${title}`,
                    description ? `**Description:** ${description}` : `**Description:** _none_`,
                ].join("\n")
            );

            await interaction.editReply(`✅ Posted a recent update to **${projectName}**.`).catch(() => { });
            return;
        }
    } catch (err: any) {
        const clean = typeof err?.message === "string" ? err.message : "Something went wrong";
        if (interaction.isRepliable()) {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: `❌ Error: ${clean}` }).catch(() => { });
            } else {
                await interaction.reply({ ephemeral: true, content: `❌ Error: ${clean}` }).catch(() => { });
            }
        } else {
            console.error("Unhandled interaction error:", err);
        }
    }
    return;
});

/**
 * Boot
 */
(async () => {
    await registerCommands();
    await client.login(config.discordBotToken);
})();
