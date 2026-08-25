$text = 'Assault 2 and Action and [Reaction] and Accelerate.'
$regex = '(?i)(?<!\[)\b(Accelerate|Hidden|Legion|Action|Reaction|Ambush|Assault|Shield|Tank|Deflect|Deathknell|Ganking|Temporary|Hunt|Level|Empowered|Vision|Equip|Predict|Burn|Empower|Add|Weaponmaster|Stun)(?:\s+\d+)?\b(?!\])'
$result = [regex]::Replace($text, $regex, { param($m) '[' + $m.Value + ']' })
Write-Output $result
