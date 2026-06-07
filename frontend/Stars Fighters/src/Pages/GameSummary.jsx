import React from 'react';
import '../Styles/GameSummary.css';

export default function GameSummary() {
    return (
        <div className="summary-container">
            <div className="summary-header">
                <h1 className="summary-title">El Choque de Leyendas</h1>
                <p className="summary-subtitle">Una historia del Bosque Olvido</p>
            </div>

            <div className="story-content">
                <div className="story-section">
                    <p>
                        En los confines de la galaxia, donde la luz de las estrellas apenas alcanza a penetrar la densa niebla, se encuentra el <strong>Bosque Olvido</strong>. Durante siglos, este lugar fue un santuario de paz, custodiado desde las sombras por el escurridizo <strong>Shinobi</strong>, un guerrero cuya velocidad y sigilo lo convirtieron en un mito entre los clanes.
                    </p>
                    <p>
                        Sin embargo, la paz se vio interrumpida cuando un guerrero errante pisó la tierra sagrada. Era el <strong>Samurai</strong>, un luchador implacable guiado por un estricto código de honor y buscando el legendario "Fragmento Estelar", una reliquia que, según las profecías, yace oculta en el corazón del bosque.
                    </p>
                </div>

                <div className="story-duel">
                    <div className="duel-character">
                        <img 
                            src="/sprites/samurai_profile.png" 
                            alt="Samurai" 
                            className="duel-avatar" 
                            onError={(e) => e.target.src = "/logo-large.png"} 
                        />
                        <h3>Samurai</h3>
                        <span className="duel-stats">15 Daño | 5 Vel</span>
                    </div>
                    
                    <div className="duel-vs">
                        <span>VS</span>
                    </div>
                    
                    <div className="duel-character">
                        <img 
                            src="/sprites/shinobi_profile.png" 
                            alt="Shinobi" 
                            className="duel-avatar" 
                            onError={(e) => e.target.src = "/logo-large.png"} 
                        />
                        <h3>Shinobi</h3>
                        <span className="duel-stats">10 Daño | 7.5 Vel</span>
                    </div>
                </div>

                <div className="story-section">
                    <p>
                        El encuentro fue inevitable. Las hojas secas apenas crujieron cuando el Shinobi descendió de las ramas más altas, bloqueando el camino del Samurai con sus kunais desenvainados. El Samurai, inmutado, desenfundó lentamente su katana, reflejando la escasa luz de la luna en su hoja de acero puro.
                    </p>
                    <p>
                        — <em>"No puedes avanzar más, forastero. Este bosque consume a los que buscan poder"</em> — susurró el Shinobi, desvaneciéndose casi en la oscuridad.
                    </p>
                    <p>
                        — <em>"Mi honor no me permite retroceder. Mi espada abrirá el camino"</em> — respondió el Samurai, adoptando una postura defensiva perfecta.
                    </p>
                    <p>
                        La batalla comenzó. El Shinobi atacaba desde todos los ángulos, una ráfaga de golpes rápidos y precisos, mientras el Samurai se mantenía como una montaña inamovible, parando cada ataque y respondiendo con tajos devastadores que partían el aire mismo. 
                    </p>
                    <p>
                        El resultado de esta batalla no está escrito en las estrellas... tú decides quién será el vencedor en la arena de <strong>StarsFighters</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}