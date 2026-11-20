/** Most Critical — composants React (window.MostCritical). */
export type IconName = 'star'|'heart'|'bookmark'|'play'|'ticket'|'search'|'check'|'alert'|'plus'|'share'|'comment'|'film';
export interface IconProps { name: IconName; size?: number; filled?: boolean; label?: string; className?: string }
export interface ButtonProps { variant?: 'primary'|'secondary'|'accent'|'ghost'; size?: 'sm'|'md'|'lg'; icon?: IconName; block?: boolean; disabled?: boolean; onClick?: (e: any) => void; children: React.ReactNode }
export interface IconButtonProps { icon: IconName; label: string; variant?: 'ghost'|'outline'|'solid'|'overlay'; toggle?: boolean; pressed?: boolean; defaultPressed?: boolean; onClick?: (e: any) => void }
export interface StarRatingProps { value?: number; defaultValue?: number; interactive?: boolean; size?: number; showValue?: boolean; onChange?: (v: number) => void }
export interface ScoreDialProps { value: number; size?: number; label?: string }
export interface ChipProps { selected?: boolean; defaultSelected?: boolean; onClick?: (e: any) => void; children: React.ReactNode }
export interface BadgeProps { tone?: 'amber'|'orange'|'soft'|'outline'; icon?: IconName; children: React.ReactNode }
export interface TextFieldProps { label?: string; placeholder?: string; hint?: string; error?: string; icon?: IconName; multiline?: boolean; rows?: number; value?: string; defaultValue?: string; onChange?: (e: any) => void }
export interface SwitchProps { label?: string; checked?: boolean; defaultChecked?: boolean; onChange?: (on: boolean) => void }
export interface TabsProps { items: { value: string; label: string; count?: number }[]; value?: string; defaultValue?: string; onChange?: (v: string) => void }
export interface AvatarProps { name: string; src?: string; size?: number; critic?: boolean }
export interface FilmCardProps { title: string; score: number; poster?: string; year?: number; duration?: string; director?: string; genres?: string[]; badge?: string; seed?: number }
export interface ReviewCardProps { author: string; rating: number; critic?: boolean; date?: string; headline?: string; likes?: number; comments?: number; liked?: boolean; children: React.ReactNode }
