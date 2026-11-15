package com.taq.cctvbilldesk

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform