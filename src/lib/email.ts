import nodemailer from 'nodemailer'

const NOTIFICATION_EMAILS = [
  'remaindervarun@gmail.com',
  'varuntejreddy03@gmail.com',
  'peralasreekar@gmail.com',
  'banothsuresh2525@gmail.com'
]

function createTransporter() {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_APP_PASSWORD?.replace(/\s+/g, '')
  
  if (!user || !pass) {
    console.error('Email credentials not configured')
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  })
}

interface TeamData {
  teamName: string
  teamId: string
  department: string
  captain: {
    name: string
    hallTicket: string
    phone: string
  }
  players: Array<{
    name: string
    hallTicket: string
    phone: string
    role: string
    isCaptain: boolean
  }>
}

export async function sendTeamCreationEmail(teamData: TeamData) {
  const playersList = teamData.players
    .map((p, i) => `${i + 1}. ${p.name} (${p.hallTicket}) - ${p.role}${p.isCaptain ? ' [CAPTAIN]' : ''}\n   Phone: ${p.phone}`)
    .join('\n')

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
      <h1 style="color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">🏏 New Team Registration</h1>
      
      <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #fbbf24; margin-top: 0;">Team Details</h2>
        <p><strong>Team Name:</strong> ${teamData.teamName}</p>
        <p><strong>Team ID:</strong> ${teamData.teamId}</p>
        <p><strong>Department:</strong> ${teamData.department}</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #fbbf24; margin-top: 0;">Captain Information</h2>
        <p><strong>Name:</strong> ${teamData.captain.name}</p>
        <p><strong>Hall Ticket:</strong> ${teamData.captain.hallTicket}</p>
        <p><strong>Phone:</strong> ${teamData.captain.phone}</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #fbbf24; margin-top: 0;">Team Players (${teamData.players.length})</h2>
        <table style="width: 100%; border-collapse: collapse; color: #ffffff;">
          <tr style="background-color: #334155;">
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">#</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Name</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Hall Ticket</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Phone</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Role</th>
          </tr>
          ${teamData.players.map((p, i) => `
            <tr style="background-color: ${p.isCaptain ? '#166534' : '#1e293b'};">
              <td style="padding: 8px; border: 1px solid #475569;">${i + 1}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.name}${p.isCaptain ? ' 👑' : ''}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.hallTicket}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.phone}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.role}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
        This is an automated notification from KMCE Cricket Championship 2026.
      </p>
    </div>
  `

  const textContent = `
🏏 NEW TEAM REGISTRATION

TEAM DETAILS:
- Team Name: ${teamData.teamName}
- Team ID: ${teamData.teamId}
- Department: ${teamData.department}

CAPTAIN:
- Name: ${teamData.captain.name}
- Hall Ticket: ${teamData.captain.hallTicket}
- Phone: ${teamData.captain.phone}

PLAYERS (${teamData.players.length}):
${playersList}

---
KMCE Cricket Championship 2026
  `

  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error('Email transporter not configured')
      return { success: false, error: 'Email not configured' }
    }
    
    transporter.sendMail({
      from: `"KMCE Cricket" <${process.env.EMAIL_USER}>`,
      to: NOTIFICATION_EMAILS.join(', '),
      subject: `New Team Created: ${teamData.teamName} (${teamData.department})`,
      text: textContent,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    }).then(() => {
      console.log('Team creation email sent')
    }).catch((err: any) => {
      console.error('Email send error:', err.message)
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send team creation email:', error.message || error)
    return { success: false, error: error.message || error }
  }
}

export async function sendPaymentConfirmationEmail(teamData: TeamData & { paymentStatus: string }) {
  const playersList = teamData.players
    .map((p, i) => `${i + 1}. ${p.name} (${p.hallTicket}) - ${p.role}${p.isCaptain ? ' [CAPTAIN]' : ''}\n   Phone: ${p.phone}`)
    .join('\n')

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
      <h1 style="color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">💰 Payment Confirmed!</h1>
      
      <div style="background-color: #166534; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">✅ PAYMENT APPROVED</h2>
        <p style="color: #bbf7d0; margin: 10px 0 0 0;">Team registration is now complete!</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #fbbf24; margin-top: 0;">Team Details</h2>
        <p><strong>Team Name:</strong> ${teamData.teamName}</p>
        <p><strong>Team ID:</strong> ${teamData.teamId}</p>
        <p><strong>Department:</strong> ${teamData.department}</p>
        <p><strong>Registration Fee:</strong> ₹3000 (PAID)</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #fbbf24; margin-top: 0;">Captain Information</h2>
        <p><strong>Name:</strong> ${teamData.captain.name}</p>
        <p><strong>Hall Ticket:</strong> ${teamData.captain.hallTicket}</p>
        <p><strong>Phone:</strong> ${teamData.captain.phone}</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #fbbf24; margin-top: 0;">Team Players (${teamData.players.length})</h2>
        <table style="width: 100%; border-collapse: collapse; color: #ffffff;">
          <tr style="background-color: #334155;">
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">#</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Name</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Hall Ticket</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Phone</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Role</th>
          </tr>
          ${teamData.players.map((p, i) => `
            <tr style="background-color: ${p.isCaptain ? '#166534' : '#1e293b'};">
              <td style="padding: 8px; border: 1px solid #475569;">${i + 1}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.name}${p.isCaptain ? ' 👑' : ''}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.hallTicket}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.phone}</td>
              <td style="padding: 8px; border: 1px solid #475569;">${p.role}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
        This is an automated notification from KMCE Cricket Championship 2026.
      </p>
    </div>
  `

  const textContent = `
💰 PAYMENT CONFIRMED!

✅ PAYMENT APPROVED - Team registration is now complete!

TEAM DETAILS:
- Team Name: ${teamData.teamName}
- Team ID: ${teamData.teamId}
- Department: ${teamData.department}
- Registration Fee: ₹3000 (PAID)

CAPTAIN:
- Name: ${teamData.captain.name}
- Hall Ticket: ${teamData.captain.hallTicket}
- Phone: ${teamData.captain.phone}

PLAYERS (${teamData.players.length}):
${playersList}

---
KMCE Cricket Championship 2026
  `

  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.error('Email transporter not configured')
      return { success: false, error: 'Email not configured' }
    }
    
    transporter.sendMail({
      from: `"KMCE Cricket" <${process.env.EMAIL_USER}>`,
      to: NOTIFICATION_EMAILS.join(', '),
      subject: `Payment Confirmed: ${teamData.teamName} (${teamData.department}) - Rs.3000 PAID`,
      text: textContent,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    }).then(() => {
      console.log('Payment confirmation email sent')
    }).catch((err: any) => {
      console.error('Email send error:', err.message)
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send payment confirmation email:', error.message || error)
    return { success: false, error }
  }
}
